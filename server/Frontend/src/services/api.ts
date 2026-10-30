import axios from "axios";
import type { Device, Attestation, AttestationType } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE;

const apiClient = axios.create({
  baseURL: API_BASE,
});


export const deviceService = {
  getAll: async (): Promise<Device[]> => {
    const response = await apiClient.get<Device[]>("/devices");
    return response.data;
  },

  updateExpectedHash: async (
    deviceId: string,
    expectedHash: string | null
  ): Promise<void> => {
    await apiClient.put(`/devices/${deviceId}/expected-hash`, {
      expected_hash: expectedHash,
    });
  },
};

// attestation endpoints
export const attestationService = {
  getByDevice: async (deviceId: string): Promise<Attestation[]> => {
    const response = await apiClient.get<Attestation[]>(
      `/attestations/${deviceId}`
    );
    return response.data;
  },

  /**
   * Run attestation with specified type
   * - "pubkey": extracts and saves public key
   * - "ecdsa": verify signature using registered public key
   * - "hmac": HMAC verification
   */
  runAttestation: async (
    deviceId: string,
    type: AttestationType = "hmac"
  ): Promise<void> => {
    await apiClient.get(`/attest/${deviceId}?type=${type}`);
  },

  /**
   * provision device: extract and save public key
   */
  provisionDevice: async (deviceId: string): Promise<void> => {
    await attestationService.runAttestation(deviceId, "pubkey");
  },

  /**
   * verify device: Use ECDSA signature verification
   */
  verifyDevice: async (deviceId: string): Promise<void> => {
    await attestationService.runAttestation(deviceId, "ecdsa");
  },
};
