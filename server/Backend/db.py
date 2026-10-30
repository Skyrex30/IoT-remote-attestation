import sqlite3
from pathlib import Path

DB_PATH = Path("attestation.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                base_url TEXT NOT NULL,
                hmac_key_hex TEXT NOT NULL,
                ecdsa_pubkey_hex TEXT, 
                expected_hash TEXT,
                is_verified INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL DEFAULT (unixepoch())
            )
        """)

        db.execute("""
            CREATE TABLE IF NOT EXISTS hmac_attestations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                nonce INTEGER NOT NULL,
                status INTEGER,
                firmware_hash TEXT,
                received_hmac TEXT,
                expected_hmac TEXT,
                valid INTEGER NOT NULL,
                reason TEXT NOT NULL,
                duration_ms REAL,
                created_at INTEGER NOT NULL DEFAULT (unixepoch()),
                FOREIGN KEY (device_id) REFERENCES devices(device_id)
            )
        """)

        db.execute("""
            CREATE TABLE IF NOT EXISTS ecdsa_attestations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                nonce INTEGER NOT NULL,
                status INTEGER,
                firmware_hash TEXT,
                signature TEXT,
                valid INTEGER NOT NULL,
                reason TEXT NOT NULL,
                duration_ms REAL,
                created_at INTEGER NOT NULL DEFAULT (unixepoch()),
                FOREIGN KEY (device_id) REFERENCES devices(device_id)
            )
        """)

        db.commit()


def seed_db():
    key_hex = (
        "12345678aabbccdd"
        "1122334455667788"
        "99aabbccddeeff00"
        "1122334455667788"
    )

    with get_db() as db:
        db.execute("""
            INSERT OR IGNORE INTO devices
            (device_id, name, base_url, hmac_key_hex, ecdsa_pubkey_hex, expected_hash, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "sensor1",
            "ESP32 Attestation Proxy",
            "http://192.168.1.9/",
            key_hex,
            None, 
            None,
            0, # Starts unverified
        ))

        db.commit()