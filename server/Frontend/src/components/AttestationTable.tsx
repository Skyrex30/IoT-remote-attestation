import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Collapse,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import type { Attestation } from "../types";

interface AttestationTableProps {
  attestations: Attestation[];
}

export function AttestationTable({ attestations }: AttestationTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "-";
    
    // Convert to milliseconds if the value is likely in seconds
    // (10 billion seconds is the year 2286, so it's a safe threshold)
    const dateMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    
    const date = new Date(dateMs);
    
    // Failsafe in case of NaN/Invalid Date
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader
        title="Attestation History"
        subheader={`${attestations.length} total attestations`}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "rgba(148, 163, 184, 0.05)",
                  "& th": {
                    color: "text.secondary",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                  },
                }}
              >
                <TableCell width={40} />
                <TableCell>Result</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Nonce</TableCell>
                <TableCell align="right">Duration (ms)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attestations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      No attestations yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attestations.map((att) => (
                  <>
                    <TableRow
                      key={`row-${att.id}`}
                      sx={{
                        borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                        "&:hover": {
                          backgroundColor: "rgba(148, 163, 184, 0.05)",
                        },
                        cursor: "pointer",
                      }}
                    >
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(att.id)}
                          sx={{
                            transform:
                              expandedId === att.id
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        >
                          <ExpandMoreIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={att.valid ? "VALID" : "FAILED"}
                          size="small"
                          color={att.valid ? "success" : "error"}
                          variant="filled"
                          sx={{
                            height: 24,
                            backgroundColor: att.valid
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                            color: att.valid ? "#10b981" : "#ef4444",
                            border: att.valid
                              ? "1px solid rgba(16, 185, 129, 0.3)"
                              : "1px solid rgba(239, 68, 68, 0.3)",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {/* Use created_at now instead of timestamp */}
                          {formatDate(att.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "monospace",
                            color: "text.secondary",
                          }}
                        >
                          {att.nonce}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {att.duration_ms}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow
                      key={`expand-${att.id}`}
                      sx={{
                        backgroundColor: expandedId === att.id
                          ? "rgba(59, 130, 246, 0.05)"
                          : "transparent",
                      }}
                    >
                      <TableCell colSpan={5} sx={{ p: 0 }}>
                        <Collapse in={expandedId === att.id} timeout="auto">
                          <Box sx={{ p: 2 }}>
                            <Stack spacing={2}>
                              {/* Show ECDSA fields if type is ecdsa */}
                              {att.type === "ecdsa" && (
                                <>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                    >
                                      FIRMWARE HASH
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {att.firmware_hash}
                                    </Typography>
                                  </Box>

                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                    >
                                      ECDSA SIGNATURE
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {att.signature || att.auth_data || "-"}
                                    </Typography>
                                  </Box>

                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                    >
                                      NONCE
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {att.nonce || "-"}
                                    </Typography>
                                  </Box>
                                </>
                              )}

                              {/* Show HMAC fields if type is hmac or not set */}
                              {att.type !== "ecdsa" && (
                                <>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                    >
                                      FIRMWARE HASH
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {att.firmware_hash}
                                    </Typography>
                                  </Box>

                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                    >
                                      RECEIVED HMAC
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {att.received_hmac || "-"}
                                    </Typography>
                                  </Box>

                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                    >
                                      EXPECTED HMAC
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "text.primary",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {att.expected_hmac || "-"}
                                    </Typography>
                                  </Box>
                                </>
                              )}

                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                >
                                  REASON
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: att.valid ? "text.primary" : "#ef4444",
                                    fontWeight: att.valid ? 400 : 500,
                                  }}
                                >
                                  {att.reason || "-"}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}