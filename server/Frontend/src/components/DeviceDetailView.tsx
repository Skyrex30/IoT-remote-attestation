import { useState, useMemo } from "react";
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from "@mui/material";
import { DeviceOverview } from "./DeviceOverview";
import { FailureAlert } from "./FailureAlert";
import { AttestationTable } from "./AttestationTable";
import type { Attestation } from "../types";

export interface DeviceType {
  device_id: string;
  name: string;
  base_url: string;
  expected_hash: string | null;
  created_at: number;
  hmac_key_hex?: string;
  ecdsa_pubkey_hex?: string | null;
  is_verified: number; // 0 or 1
  [key: string]: unknown;
}

interface DeviceDetailViewProps {
  device: DeviceType;
  attestations: Attestation[];
  onRunAttestation: () => Promise<void>;
  onProvisionDevice: () => Promise<void>;
  onVerifyDevice: (type?: "hmac" | "ecdsa") => Promise<void>;
  onSaveHash: (hash: string | null) => Promise<void>;
  onBack: () => void;
  isRunning: boolean;
  isSaving: boolean;
  isProvisioning: boolean;
}

export function DeviceDetailView({
  device,
  attestations,
  onRunAttestation,
  onProvisionDevice,
  onVerifyDevice,
  onSaveHash,
  onBack,
  isRunning,
  isSaving,
  isProvisioning,
}: DeviceDetailViewProps) {
  
  const [showAlert, setShowAlert] = useState(true);

  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  const filteredAndSortedAttestations = useMemo(() => {
    if (!attestations) return [];
    
    const filtered = attestations.filter((attestation) => {
      const matchesText = !logSearchQuery || Object.values(attestation).some(
        (value) => value && String(value).toLowerCase().includes(logSearchQuery.toLowerCase())
      );

      const matchesType = logTypeFilter === "all" || 
        (attestation.type && String(attestation.type).toLowerCase() === logTypeFilter);

      let matchesStatus = true;
      const isValid = attestation.valid === 1 || attestation.valid === true;

      if (logStatusFilter === "failed") {
        matchesStatus = !isValid;
      } else if (logStatusFilter === "success") {
        matchesStatus = isValid;
      }

      let matchesDate = true;
      if (logStartDate || logEndDate) {
        const rawDate = attestation.created_at; 
        if (rawDate) {
          const dateMs = rawDate < 10000000000 ? rawDate * 1000 : rawDate;
          const attDate = new Date(dateMs).toISOString().split('T')[0];
          
          if (logStartDate && attDate < logStartDate) matchesDate = false;
          if (logEndDate && attDate > logEndDate) matchesDate = false;
        } else {
          matchesDate = false; 
        }
      }

      return matchesText && matchesType && matchesStatus && matchesDate;
    });

    return filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    
  }, [attestations, logSearchQuery, logTypeFilter, logStatusFilter, logStartDate, logEndDate]);

  const isCompromised = filteredAndSortedAttestations.length > 0
    ? filteredAndSortedAttestations[0].valid === 0 || filteredAndSortedAttestations[0].valid === false
    : false;

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 4, alignItems: "flex-start" }}>
      {/* Left side: Device Details + Failure Alert */}
      <Box sx={{ width: { xs: "100%", lg: "35%" }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        
        <DeviceOverview
          device={device}
          onRunAttestation={onRunAttestation}
          onProvisionDevice={onProvisionDevice}
          onVerifyDevice={onVerifyDevice}
          onSaveHash={onSaveHash}
          onBack={onBack}
          isRunning={isRunning}
          isSaving={isSaving}
          isProvisioning={isProvisioning}
          isVerified={!isCompromised}
        />

        {showAlert && (
          <FailureAlert attestations={attestations} onDismiss={() => setShowAlert(false)} />
        )}
      </Box>

      {/* Right side: Attestation History with filter */}
      <Box sx={{ width: { xs: "100%", lg: "65%" }, flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        
        {/* Filter Bar */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            label="Search Logs"
            variant="outlined"
            size="small"
            value={logSearchQuery}
            onChange={(e) => setLogSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: "150px", backgroundColor: "white" }}
          />

          <FormControl size="small" sx={{ minWidth: 110, backgroundColor: "white" }}>
            <InputLabel>Type</InputLabel>
            <Select value={logTypeFilter} label="Type" onChange={(e) => setLogTypeFilter(e.target.value as string)}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="hmac">HMAC</MenuItem>
              <MenuItem value="ecdsa">ECDSA</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 110, backgroundColor: "white" }}>
            <InputLabel>Status</InputLabel>
            <Select value={logStatusFilter} label="Status" onChange={(e) => setLogStatusFilter(e.target.value as string)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>

          {/* Date Range Start */}
          <TextField
            label="Start Date"
            type={logStartDate ? "date" : "text"}
            onFocus={(e) => ((e.target as HTMLInputElement).type = "date")}
            onBlur={(e) => {
              if (!e.target.value) (e.target as HTMLInputElement).type = "text";
            }}
            variant="outlined"
            size="small"
            value={logStartDate}
            onChange={(e) => setLogStartDate(e.target.value)}
            sx={{ maxWidth: 140, backgroundColor: "white" }}
          />
          
          <Box sx={{ color: "text.secondary" }}>-</Box>

          {/* Date Range End */}
          <TextField
            label="End Date"
            type={logEndDate ? "date" : "text"}
            onFocus={(e) => ((e.target as HTMLInputElement).type = "date")}
            onBlur={(e) => {
              if (!e.target.value) (e.target as HTMLInputElement).type = "text";
            }}
            variant="outlined"
            size="small"
            value={logEndDate}
            onChange={(e) => setLogEndDate(e.target.value)}
            sx={{ maxWidth: 140, backgroundColor: "white" }}
          />
        </Box>

        <AttestationTable attestations={filteredAndSortedAttestations} />
      </Box>
    </Box>
  );
}