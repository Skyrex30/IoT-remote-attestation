import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Stack,
  alpha,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CircleIcon from "@mui/icons-material/Circle";
import type { Device } from "../types";

interface DeviceCardProps {
  device: Device;
  isSelected?: boolean;
  isVerified?: boolean;
  onClick: () => void;
}

export function DeviceCard({
  device,
  isSelected = false,
  isVerified = false,
  onClick,
}: DeviceCardProps) {
  const statusColor = isVerified ? "success" : "default";
  const statusLabel = isVerified ? "VERIFIED" : "COMPROMISED";

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        border: isSelected ? "2px solid #3b82f6" : "1px solid rgba(148, 163, 184, 0.1)",
        backgroundColor: isSelected
          ? alpha("#3b82f6", 0.1)
          : "rgba(160, 168, 180, 0.4)",
        "&:hover": {
            backgroundColor: "rgba(229, 231, 235, 0.5)",
            borderColor: "rgba(106, 110, 116, 0.3)",
            transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {device.name}
              </Typography>
              <CircleIcon
                sx={{
                  width: 8,
                  height: 8,
                  color: "rgba(148, 163, 184, 0.5)",
                  fill: "rgba(148, 163, 184, 0.5)",
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "monospace",
                color: "text.secondary",
                display: "block",
              }}
            >
              {device.device_id}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: "text.secondary" }} />
        </Box>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Base URL
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "text.primary",
                wordBreak: "break-all",
              }}
            >
              {device.base_url}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Device ID
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.primary", fontSize: "0.85rem" }}
              >
                {device.device_id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Created
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.primary", fontSize: "0.85rem" }}
              >
                {new Date(device.created_at * 1000).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(148, 163, 184, 0.1)",
          pt: 1.5,
        }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Status
        </Typography>
        <Chip
          label={statusLabel}
          size="small"
          color={statusColor}
          variant="filled"
          sx={{
            height: 24,
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
      </CardActions>
    </Card>
  );
}
