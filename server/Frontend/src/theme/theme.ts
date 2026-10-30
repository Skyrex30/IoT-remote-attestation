import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2a2a2a",
      light: "#4a4a4a",
      dark: "#1a1a1a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#6b7280",
      light: "#9ca3af",
      dark: "#4b5563",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#1e40af",
    },
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
    },
    divider: "rgba(107, 114, 128, 0.2)",
  },
  typography: {
    fontFamily: '"Inter", system-ui, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: "2.25rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      color: "#1f2937",
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      letterSpacing: "-0.015em",
      color: "#1f2937",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#1f2937",
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 500,
      color: "#1f2937",
    },
    h5: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "#1f2937",
    },
    h6: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#1f2937",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#1f2937",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#6b7280",
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "#9ca3af",
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#9ca3af",
    },
    button: {
      fontWeight: 500,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
            backgroundColor: "#f9fafb",
            backgroundImage: "none",
            margin: 0,
            padding: 0,
            },
            html: {
            margin: 0,
            padding: 0,
            },
            "#root": {
            background: "transparent",
            margin: 0,
            padding: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#e5e7eb",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(107, 114, 128, 0.2)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          textTransform: "none",
          transition: "all 0.2s ease-in-out",
          borderRadius: 8,
        },
        contained: {
          background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)",
          color: "#ffffff",
          boxShadow: "0 4px 15px rgba(42, 42, 42, 0.15)",
          "&:hover": {
            boxShadow: "0 8px 25px rgba(42, 42, 42, 0.25)",
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        outlined: {
          borderColor: "rgba(107, 114, 128, 0.3)",
          color: "#2a2a2a",
          "&:hover": {
            borderColor: "#2a2a2a",
            backgroundColor: "rgba(42, 42, 42, 0.05)",
          },
        },
        text: {
          color: "#2a2a2a",
          "&:hover": {
            backgroundColor: "rgba(42, 42, 42, 0.05)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(107, 114, 128, 0.15)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            borderColor: "rgba(42, 42, 42, 0.2)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(107, 114, 128, 0.2)",
          padding: "20px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          height: 28,
          fontSize: "0.75rem",
          border: "1px solid rgba(107, 114, 128, 0.3)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: "#f3f4f6",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(107, 114, 128, 0.15)",
          borderRadius: 8,
          color: "#1f2937",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f3f4f6",
          "& .MuiTableCell-head": {
            backgroundColor: "#f3f4f6",
            color: "#4b5563",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "1px solid rgba(107, 114, 128, 0.2)",
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            borderBottom: "1px solid rgba(107, 114, 128, 0.15)",
            "&:hover": {
              backgroundColor: "rgba(42, 42, 42, 0.03)",
            },
            "& .MuiTableCell-body": {
              color: "#1f2937",
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            border: "1px solid rgba(107, 114, 128, 0.2)",
            borderRadius: 8,
            "& fieldset": {
              borderColor: "rgba(107, 114, 128, 0.2)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(42, 42, 42, 0.3)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2a2a2a",
            },
          },
          "& .MuiOutlinedInput-input": {
            color: "#1f2937",
            fontSize: "0.95rem",
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          color: "#1f2937",
          fontSize: "0.95rem",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "inherit",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(156, 163, 175, 0.2)",
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: "#ef4444",
        },
      },
    },
    MuiCollapse: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 42, 42, 0.03)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(31, 41, 55, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(107, 114, 128, 0.2)",
          color: "#ffffff",
          fontSize: "0.75rem",
        },
      },
    },
  },
});
