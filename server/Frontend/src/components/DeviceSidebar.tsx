import type { Device } from "../types";
import "../styles/DeviceSidebar.css";

interface DeviceSidebarProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
}

export function DeviceSidebar({
  devices,
  selectedDeviceId,
  onSelectDevice,
}: DeviceSidebarProps) {
  return (
    <aside className="card sidebar">
      <h2>Devices</h2>

      {devices.map((device) => (
        <button
          key={device.device_id}
          className={
            selectedDeviceId === device.device_id ? "device active" : "device"
          }
          onClick={() => onSelectDevice(device.device_id)}
        >
          <strong>{device.name}</strong>
          <span>{device.device_id}</span>
        </button>
      ))}
    </aside>
  );
}
