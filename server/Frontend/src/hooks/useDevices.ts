import { useEffect, useState } from "react";
import { deviceService } from "../services/api";
import type { Device } from "../types";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getAll();
      setDevices(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load devices"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadDevices();
    };
    initialize();
  }, []);

  return { devices, loading, error, refetch: loadDevices };
}
