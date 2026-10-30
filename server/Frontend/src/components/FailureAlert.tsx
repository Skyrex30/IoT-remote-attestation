import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import type { Attestation } from "../types";

interface FailureAlertProps {
  attestations: Attestation[];
  onDismiss: () => void;
}

export function FailureAlert({ attestations, onDismiss }: FailureAlertProps) {
  const failedAttestations = attestations.filter((a) => !a.valid);

  if (failedAttestations.length === 0) return null;

  return (
    <Alert
      severity="error"
      icon={<WarningIcon />}
      sx={{
        mb: 3,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: 1,
        "& .MuiAlert-icon": {
          color: "#ef4444",
        },
      }}
      action={
        <IconButton
          size="small"
          color="error"
          onClick={onDismiss}
          sx={{
            color: "#ef4444",
            "&:hover": {
              backgroundColor: "rgba(239, 68, 68, 0.1)",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      <AlertTitle sx={{ fontWeight: 600, mb: 1, color: "#ef4444" }}>
        {failedAttestations.length} Failed Attestation
        {failedAttestations.length !== 1 ? "s" : ""}
      </AlertTitle>

      <Stack spacing={1}>
        {failedAttestations.slice(0, 3).map((att) => (
          <Box
            key={att.id}
            sx={{
              pb: 1,
              borderBottom: "1px solid rgba(239, 68, 68, 0.15)",
              "&:last-child": {
                borderBottom: "none",
                pb: 0,
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#fecaca", fontWeight: 500 }}
            >
              {att.reason || "Unknown failure"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(239, 68, 68, 0.7)",
                fontFamily: "monospace",
                display: "block",
                mt: 0.5,
              }}
            >
              {new Date(att.created_at * 1000).toLocaleString()}
            </Typography>
          </Box>
        ))}

        {failedAttestations.length > 3 && (
          <Typography variant="caption" sx={{ color: "rgba(239, 68, 68, 0.7)" }}>
            +{failedAttestations.length - 3} more failures
          </Typography>
        )}
      </Stack>
    </Alert>
  );
}
