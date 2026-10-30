import { useEffect, useState } from "react";
import { attestationService } from "../services/api";
import type { Attestation } from "../types";

export function useAttestations(deviceId: string | null) {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttestations = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await attestationService.getByDevice(id);
      setAttestations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attestations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (deviceId) {
        await loadAttestations(deviceId);
      }
    };
    initialize();
  }, [deviceId]);

  return { attestations, loading, error, refetch: loadAttestations };
}
