import type { Device } from "../types";
import "../styles/DeviceInfo.css";

interface DeviceInfoProps {
  device: Device;
  onRunAttestation: () => void;
  isLoading: boolean;
}

export function DeviceInfo({
  device,
  onRunAttestation,
  isLoading,
}: DeviceInfoProps) {
  return (
    <div className="card">
      <h2>{device.name}</h2>

      <div className="info">
        <p>
          <strong>Device ID:</strong> {device.device_id}
        </p>
        <p>
          <strong>Base URL:</strong> {device.base_url}
        </p>
        <p>
          <strong>Expected hash:</strong> {device.expected_hash ?? "Not set"}
        </p>
      </div>

      <button onClick={onRunAttestation} disabled={isLoading}>
        {isLoading ? "Running..." : "Run attestation"}
      </button>
    </div>
  );
}
