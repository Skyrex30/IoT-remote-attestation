import { useState, useMemo, useEffect } from "react";
import { Box, Stack } from "@mui/material";
import {
  Header,
  DeviceCard,
  DeviceDetailView,
} from "../components";
import { useDevices, useAttestations } from "../hooks";
import { deviceService, attestationService } from "../services/api";

export function Dashboard() {
  const { devices, refetch: refetchDevices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const initializeFromUrl = () => {
      const path = window.location.pathname;
      const match = path.match(/\/device\/([^/]+)$/);
      if (match) {
        setSelectedDevice(match[1]);
      }
    };
    initializeFromUrl();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      window.history.pushState(null, "", `/device/${selectedDevice}`);
    } else {
      window.history.pushState(null, "", "/");
    }
  }, [selectedDevice]);

  const selected = devices.find((d) => d.device_id === selectedDevice);
  const { attestations, refetch: refetchAttestations } = useAttestations(selectedDevice);

  // Filter for devices 
  const filteredDevices = useMemo(() => {
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [devices, searchQuery]);

  const handleRunAttestation = async () => {
    if (!selectedDevice) return;

    setIsRunning(true);
    try {
      await attestationService.runAttestation(selectedDevice);
      await refetchAttestations(selectedDevice);
      await refetchDevices();
    } finally {
      setIsRunning(false);
    }
  };

  const handleProvisionDevice = async () => {
    if (!selectedDevice) return;

    setIsProvisioning(true);
    try {
      await attestationService.provisionDevice(selectedDevice);
      await refetchDevices();
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleVerifyDevice = async (type: "hmac" | "ecdsa" = "hmac") => {
    if (!selectedDevice) return;

    setIsRunning(true);
    try {
      await attestationService.runAttestation(selectedDevice, type);
      await refetchAttestations(selectedDevice);
      await refetchDevices();
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveHash = async (hash: string | null) => {
    if (!selectedDevice) return;

    setIsSaving(true);
    try {
      await deviceService.updateExpectedHash(selectedDevice, hash);
      await refetchDevices();
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setSelectedDevice(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        backgroundColor: "#f9fafb",
      }}
    >
      <Header onSearch={setSearchQuery} />

      <Box
        sx={{
          py: 4,
          px: 4,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {selected ? (
          <DeviceDetailView
            device={selected}
            attestations={attestations || []}
            onRunAttestation={handleRunAttestation}
            onProvisionDevice={handleProvisionDevice}
            onVerifyDevice={handleVerifyDevice}
            onSaveHash={handleSaveHash}
            onBack={handleBack}
            isRunning={isRunning}
            isSaving={isSaving}
            isProvisioning={isProvisioning}
          />
        ) : (
          <Stack spacing={3}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 2,
              }}
            >
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.device_id}
                  device={device}
                  isSelected={selectedDevice === device.device_id}
                  onClick={() => setSelectedDevice(device.device_id)}
                  isVerified={device.is_verified === 1} 
                />
              ))}
            </Box>
          </Stack>
        )}
      </Box>
    </Box>
  );
}