export type Device = {
  device_id: string;
  name: string;
  base_url: string;
  expected_hash: string | null;
  ecdsa_pubkey_hex?: string | null;
  is_verified: number;
  created_at: number;
};

export type Attestation = {
  id: number;
  device_id: string;
  nonce: number;
  status: number;
  firmware_hash: string;
  received_hmac?: string;
  expected_hmac?: string;
  auth_data?: string; 
  signature?: string; 
  valid: boolean | number; 
  reason: string;
  duration_ms: number;
  created_at: number;
  type?: "hmac" | "ecdsa"; 
};

export type AttestationType = "hmac" | "ecdsa" | "pubkey";