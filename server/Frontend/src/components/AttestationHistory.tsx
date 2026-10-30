import type { Attestation } from "../types";
import "../styles/AttestationHistory.css";

interface AttestationHistoryProps {
  attestations: Attestation[];
}

export function AttestationHistory({ attestations }: AttestationHistoryProps) {
  return (
    <div className="card">
      <h2>Attestation History</h2>

      <table>
        <thead>
          <tr>
            <th>Valid</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Nonce</th>
            <th>Duration</th>
            <th>Firmware Hash</th>
          </tr>
        </thead>

        <tbody>
          {attestations.map((a) => (
            <tr key={a.id}>
              <td>{a.valid ? "OK" : "FAIL"}</td>
              <td>{a.reason}</td>
              <td>{a.status}</td>
              <td>{a.nonce}</td>
              <td>{a.duration_ms} ms</td>
              <td className="hash">{a.firmware_hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
