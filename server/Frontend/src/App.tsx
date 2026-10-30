import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { Dashboard } from "./pages/Dashboard";
import { theme } from "./theme/theme";
import "./App.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;