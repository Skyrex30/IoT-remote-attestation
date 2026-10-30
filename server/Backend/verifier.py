import hmac
import hashlib
import struct
from ecdsa import VerifyingKey, NIST256p, util

def swap32_blocks(data: bytes) -> bytes:
    if len(data) % 4 != 0:
        raise ValueError(f"data length must be multiple of 4, got {len(data)}")
    return b"".join(data[i:i + 4][::-1] for i in range(0, len(data), 4))


def stm32_hash_32b(data: bytes) -> bytes:
    return hashlib.sha256(swap32_blocks(data)).digest()


def stm32_hmac_32b(key: bytes, msg: bytes) -> bytes:
    block_size = 64
    if len(key) > block_size:
        key = stm32_hash_32b(key)
    key_block = key + bytes(block_size - len(key))

    ipad = bytes([b ^ 0x36 for b in key_block])
    opad = bytes([b ^ 0x5C for b in key_block])

    inner_hash = stm32_hash_32b(ipad + msg)
    return stm32_hash_32b(opad + inner_hash)


def verify_attestation(report: dict, expected_nonce: int, attest_type: str, device: dict) -> dict:
    required = ["status", "nonce", "timestamp", "hash", "auth_data", "auth_len"]

    for field in required:
        if field not in report:
            return {"valid": False, "reason": f"missing field: {field}", "nonce": expected_nonce}

    try:
        status = int(report["status"])
        nonce = int(report["nonce"])
        timestamp = int(report["timestamp"])
        fw_hash = bytes.fromhex(report["hash"])
        auth_data = bytes.fromhex(report["auth_data"])
    except Exception:
        return {"valid": False, "reason": "invalid field encoding", "nonce": expected_nonce}

    if nonce != expected_nonce:
        return {"valid": False, "reason": "nonce mismatch", "nonce": nonce, "status": status, "timestamp": timestamp}

    if status < 0 or status > 255:
        return {"valid": False, "reason": "invalid status byte", "nonce": nonce, "timestamp": timestamp}

    verification_result = {
        "valid": False,
        "reason": "unknown algorithm",
        "status": status,
        "nonce": nonce,
        "timestamp": timestamp,
        "hash": fw_hash.hex(),
        "auth_data": auth_data.hex(),
    }

    # FIRMWARE HASH CHECK
    expected_hash = device.get("expected_hash")
    if expected_hash and not hmac.compare_digest(fw_hash.hex(), expected_hash.lower()):
        verification_result["reason"] = "firmware hash mismatch"
        return verification_result

    # HMAC VERIFICATION PATH
    if attest_type == "hmac":
        # Reconstruct the 44-byte HMAC message layout: Hash first
        msg = fw_hash + struct.pack("<I", nonce) + struct.pack("<I", timestamp) + bytes([status, 0, 0, 0])
        
        key = bytes.fromhex(device["hmac_key_hex"])
        expected_hmac = hmac.new(key, msg, hashlib.sha256).digest()
        verification_result["expected_data"] = expected_hmac.hex()
        
        if hmac.compare_digest(auth_data, expected_hmac):
            verification_result["valid"] = True
            verification_result["reason"] = "ok"
        else:
            verification_result["reason"] = "hmac mismatch"

    # ECDSA VERIFICATION PATH
    elif attest_type == "ecdsa":
        pub_hex = device.get("ecdsa_pubkey_hex")
        if not pub_hex:
            verification_result["reason"] = "no public key registered for device"
            return verification_result
            
        pub_bytes = bytes.fromhex(pub_hex)
        
        # Reconstruct the 44-byte ECDSA message layout: Nonce and Timestamp first
        msg = struct.pack("<I", nonce) + struct.pack("<I", timestamp) + bytes([status, 0, 0, 0]) + fw_hash
        
        try:
            # Parse the SECP256R1 Uncompressed PK (Skip the 0x04 byte)
            vk = VerifyingKey.from_string(pub_bytes[1:], curve=NIST256p)
            
            # hash the message payload using standard SHA-256
            msg_hash = hashlib.sha256(msg).digest()
            
            # Verify the ASN.1 DER signature
            if vk.verify_digest(auth_data, msg_hash, sigdecode=util.sigdecode_der):
                verification_result["valid"] = True
                verification_result["reason"] = "ok"
            else:
                verification_result["reason"] = "ecdsa signature math mismatch"
        except util.MalformedSignature:
            verification_result["reason"] = "malformed ecdsa signature"
        except Exception as e:
            verification_result["reason"] = f"ecdsa verification failed: {str(e)}"

    return verification_result
