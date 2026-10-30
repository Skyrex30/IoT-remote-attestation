import time
import secrets
from urllib.parse import urljoin

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

from db import get_db, init_db, seed_db
from verifier import verify_attestation

app = Flask(__name__)
CORS(app)


def get_device(device_id: str):
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM devices WHERE device_id = ?",
            (device_id,)
        ).fetchone()
        
        return dict(row) if row else None


def save_attestation(device_id: str, result: dict, duration_ms: float, attest_type: str):
    is_valid = 1 if result["valid"] else 0
    
    with get_db() as db:
        if attest_type == "hmac":
            db.execute("""
                INSERT INTO hmac_attestations (
                    device_id, nonce, status, firmware_hash,
                    received_hmac, expected_hmac, valid, reason, duration_ms
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                device_id,
                result.get("nonce"),
                result.get("status"),
                result.get("hash"),
                result.get("auth_data"), 
                result.get("expected_data"),
                is_valid,
                result["reason"],
                duration_ms,
            ))
        elif attest_type == "ecdsa":
            db.execute("""
                INSERT INTO ecdsa_attestations (
                    device_id, nonce, status, firmware_hash,
                    signature, valid, reason, duration_ms
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                device_id,
                result.get("nonce"),
                result.get("status"),
                result.get("hash"),
                result.get("auth_data"),
                is_valid,
                result["reason"],
                duration_ms,
            ))
            
        db.execute("""
            UPDATE devices 
            SET is_verified = ? 
            WHERE device_id = ?
        """, (is_valid, device_id))
        
        db.commit()


@app.route("/")
def index():
    return jsonify({
        "service": "attestation-server",
        "routes": [
            "/devices",
            "/devices/<device_id>",
            "/attest/<device_id>",
            "/attestations/<device_id>",
        ],
    })


@app.route("/devices")
def list_devices():
    with get_db() as db:
        rows = db.execute("""
            SELECT device_id, name, base_url, expected_hash, is_verified, created_at
            FROM devices
            ORDER BY id DESC
        """).fetchall()

    return jsonify([dict(row) for row in rows])


@app.route("/devices/<device_id>")
def device_details(device_id: str):
    device = get_device(device_id)

    if device is None:
        return jsonify({"ok": False, "error": "unknown device"}), 404

    return jsonify({
        "device_id": device["device_id"],
        "name": device["name"],
        "base_url": device["base_url"],
        "expected_hash": device["expected_hash"],
        "is_verified": device["is_verified"],
        "created_at": device["created_at"],
    })


@app.route("/devices", methods=["POST"])
def create_device():
    data = request.get_json(force=True)

    device_id = data["device_id"]
    name = data["name"]
    base_url = data["base_url"]
    hmac_key_hex = data["hmac_key_hex"]
    expected_hash = data.get("expected_hash")

    bytes.fromhex(hmac_key_hex)

    with get_db() as db:
        db.execute("""
            INSERT INTO devices
            (device_id, name, base_url, hmac_key_hex, expected_hash, is_verified)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            device_id,
            name,
            base_url,
            hmac_key_hex.lower(),
            expected_hash.lower() if expected_hash else None,
            0,
        ))

        db.commit()

    return jsonify({"ok": True})


@app.route("/attest/<device_id>")
def attest_device(device_id: str):
    device = get_device(device_id)

    if device is None:
        return jsonify({"ok": False, "error": "unknown device"}), 404

    attest_type = request.args.get("type", "hmac").lower()
    if attest_type not in ["hmac", "ecdsa", "pubkey"]:
        return jsonify({"ok": False, "error": "invalid type parameter"}), 400

    nonce = secrets.randbits(32)
    url = urljoin(device["base_url"], f"/attest?nonce={nonce}&type={attest_type}")

    started = time.time()

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        report = response.json()
    except requests.RequestException as exc:
        return jsonify({"ok": False, "device": device_id, "error": "device request failed", "details": str(exc)}), 502

    duration_ms = round((time.time() - started) * 1000, 2)

    if attest_type == "pubkey":
        pubkey_hex = report.get("auth_data", "")
        if len(pubkey_hex) == 130 and pubkey_hex.startswith("04"):
            with get_db() as db:
                db.execute("UPDATE devices SET ecdsa_pubkey_hex = ? WHERE device_id = ?", (pubkey_hex, device_id))
                db.commit()
            return jsonify({"ok": True, "action": "pubkey_registered", "pubkey": pubkey_hex, "duration_ms": duration_ms})
        else:
            return jsonify({"ok": False, "error": "Invalid Public Key format received"}), 502

    verification = verify_attestation(report, nonce, attest_type, device)
    save_attestation(device_id, verification, duration_ms, attest_type)

    return jsonify({
        "ok": verification["valid"],
        "device": device_id,
        "device_name": device["name"],
        "type": attest_type,
        "duration_ms": duration_ms,
        "raw_report": report,
        "verification": verification,
    })


@app.route("/attestations/<device_id>")
def attestations(device_id: str):
    with get_db() as db:
        hmac_rows = db.execute("""
            SELECT *, 'hmac' as type
            FROM hmac_attestations
            WHERE device_id = ?
            ORDER BY id DESC
            LIMIT 50
        """, (device_id,)).fetchall()

        ecdsa_rows = db.execute("""
            SELECT *, 'ecdsa' as type
            FROM ecdsa_attestations
            WHERE device_id = ?
            ORDER BY id DESC
            LIMIT 50
        """, (device_id,)).fetchall()

    all_attestations = sorted(
        [dict(row) for row in hmac_rows] + [dict(row) for row in ecdsa_rows],
        key=lambda x: x['created_at'],
        reverse=True
    )[:50]

    return jsonify(all_attestations)


@app.route("/devices/<device_id>/expected-hash", methods=["PUT"])
def update_expected_hash(device_id: str):
    data = request.get_json(force=True)

    expected_hash = data.get("expected_hash")

    if expected_hash is not None:
        expected_hash = expected_hash.lower()

        try:
            hash_bytes = bytes.fromhex(expected_hash)
        except ValueError:
            return jsonify({
                "ok": False,
                "error": "expected_hash must be valid hex",
            }), 400

        if len(hash_bytes) != 32:
            return jsonify({
                "ok": False,
                "error": "expected_hash must be 32 bytes / 64 hex characters",
            }), 400

    with get_db() as db:
        result = db.execute("""
            UPDATE devices
            SET expected_hash = ?
            WHERE device_id = ?
        """, (
            expected_hash,
            device_id,
        ))

        db.commit()

    if result.rowcount == 0:
        return jsonify({
            "ok": False,
            "error": "unknown device",
        }), 404

    return jsonify({
        "ok": True,
        "device_id": device_id,
        "expected_hash": expected_hash,
    })


if __name__ == "__main__":
    init_db()
    seed_db()
    app.run(host="127.0.0.1", port=5000, debug=True)