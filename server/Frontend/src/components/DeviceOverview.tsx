import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import type { Device } from "../types";

interface DeviceOverviewProps {
  device: Device;
  onRunAttestation: () => void;
  onSaveHash: (hash: string | null) => void;
  onBack: () => void;
  onProvisionDevice?: () => void;
  onVerifyDevice?: (type: "hmac" | "ecdsa") => void;
  isRunning?: boolean;
  isSaving?: boolean;
  isProvisioning?: boolean;
  isVerified?: boolean;
}

export function DeviceOverview({
  device,
  onRunAttestation,
  onSaveHash,
  onBack,
  onProvisionDevice,
  onVerifyDevice,
  isRunning = false,
  isSaving = false,
  isProvisioning = false,
  isVerified = false,
}: DeviceOverviewProps) {
  const [expectedHash, setExpectedHash] = useState(device.expected_hash ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [attestationType, setAttestationType] = useState<"hmac" | "ecdsa">("hmac");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const isProvisioned = device.ecdsa_pubkey_hex !== null && device.ecdsa_pubkey_hex !== undefined;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(expectedHash);
  };

  const handleSave = () => {
    const hashValue = expectedHash.trim() === "" ? null : expectedHash.trim();
    onSaveHash(hashValue);
    setIsEditing(false);
  };

  return (
    <Stack spacing={2}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          alignSelf: "flex-start",
          color: "text.secondary",
          "&:hover": {
            color: "text.primary",
          },
        }}
      >
        Back to all devices
      </Button>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {device.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {device.device_id}
              </Typography>
            </Box>
            <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
              <Chip
                label={isVerified ? "VERIFIED" : "COMPROMISED"}
                color={isVerified ? "success" : "default"}
                variant="filled"
                sx={{
                  height: 32,
                  backgroundColor: isVerified
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(128, 108, 107, 0.15)",
                  color: isVerified ? "#10b981" : "#d32020ff",
                  border: isVerified
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(221, 64, 64, 0.3)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              />
              {isProvisioned && (
                <Chip
                  label="PROVISIONED"
                  color="success"
                  variant="filled"
                  sx={{
                    height: 28,
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  Base URL
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    color: "text.primary",
                    wordBreak: "break-all",
                  }}
                >
                  {device.base_url}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                >
                  Created
                </Typography>
                <Typography variant="body2" sx={{ color: "text.primary" }}>
                  {new Date(device.created_at * 1000).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderTop: "1px solid rgba(148, 163, 184, 0.1)", pt: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 1 }}
            >
              Expected Firmware Hash
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                placeholder="Enter SHA-256 hash or leave empty"
                variant="outlined"
                size="small"
                multiline
                rows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  color: "text.secondary",
                  wordBreak: "break-all",
                  minHeight: 40,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {expectedHash || "Not set"}
              </Typography>
            )}
          </Box>

          {/* Public Key Display */}
          {isProvisioned && (
            <Box sx={{ borderTop: "1px solid rgba(148, 163, 184, 0.1)", pt: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mb: 1 }}
              >
                ECDSA Public Key
              </Typography>
              <Box
                sx={{
                  backgroundColor: "rgba(148, 163, 184, 0.05)",
                  padding: 1.5,
                  borderRadius: 1,
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  wordBreak: "break-all",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "text.secondary",
                  }}
                >
                  {device.ecdsa_pubkey_hex || "No public key available"}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", display: "block", mt: 1 }}
              >
                ✓ Device is provisioned and ready for ECDSA verification
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "flex-end",
            borderTop: "1px solid rgba(148, 163, 184, 0.1)",
            flexWrap: "wrap",
          }}
        >
          {isEditing && (
            <>
              <Tooltip title="Copy to clipboard">
                <IconButton size="small" onClick={handleCopy}>
                  <FileCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                onClick={handleSave}
                variant="contained"
                size="small"
                startIcon={
                  isSaving ? <CircularProgress size={16} /> : <SaveIcon />
                }
                disabled={isSaving}
              >
                Save
              </Button>
            </>
          )}
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outlined"
              size="small"
            >
              Edit Hash
            </Button>
          )}

          {/* Request Public Key Button */}
          {onProvisionDevice && (
            <Button
              onClick={onProvisionDevice}
              variant="outlined"
              size="small"
              startIcon={
                isProvisioning ? <CircularProgress size={16} /> : <PlayArrowIcon />
              }
              disabled={isProvisioning}
              sx={{
                borderColor: "#f59e0b",
                color: "#f59e0b",
                "&:hover": {
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  borderColor: "#d97706",
                },
              }}
            >
              {isProvisioning ? "Requesting..." : "Request Public Key"}
            </Button>
          )}

          {/* Verification/Attestation Button */}
          {onVerifyDevice && (
            <>
              <Button
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                variant="contained"
                size="small"
                endIcon={<ExpandMoreIcon />}
                disabled={isRunning}
                sx={{
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "#059669",
                  },
                }}
              >
                {isRunning ? "Verifying..." : "Run Verification"}
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setAttestationType("hmac");
                    onVerifyDevice("hmac");
                    setMenuAnchor(null);
                  }}
                  selected={attestationType === "hmac"}
                >
                  HMAC
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAttestationType("ecdsa");
                    onVerifyDevice("ecdsa");
                    setMenuAnchor(null);
                  }}
                  selected={attestationType === "ecdsa"}
                >
                  ECDSA
                </MenuItem>
              </Menu>
            </>
          )}

          {/* Fallback: Show standard attestation button if no provisioning handlers */}
          {!onProvisionDevice && !onVerifyDevice && (
            <Button
              onClick={onRunAttestation}
              variant="contained"
              size="small"
              startIcon={
                isRunning ? <CircularProgress size={16} /> : <PlayArrowIcon />
              }
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run Attestation"}
            </Button>
          )}
        </CardActions>
      </Card>
    </Stack>
  );
}
