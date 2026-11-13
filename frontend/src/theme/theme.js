import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#EC5E27",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#64748B",
    },
    background: {
      default: "#FDFDF1",
      paper: "#FFFFFF",
    },
    success: { main: "#16A34A" },
    warning: { main: "#F59E0B" },
    error: { main: "#DC2626" },
    info: { main: "#3B82F6" },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
});

export default theme;