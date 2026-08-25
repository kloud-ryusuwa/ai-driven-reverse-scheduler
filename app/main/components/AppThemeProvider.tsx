"use client";

import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f5eff", dark: "#1645bf" },
    background: { default: "#f5f7fb", paper: "#ffffff" },
    text: { primary: "#172033", secondary: "#687086" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, "Noto Sans JP", "Hiragino Sans", system-ui, sans-serif',
    h1: { fontSize: "2rem", fontWeight: 750, letterSpacing: "-0.035em" },
    h2: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 10, boxShadow: "none" } } },
    MuiCard: { styleOverrides: { root: { border: "1px solid #e6eaf2", boxShadow: "0 8px 30px rgba(28, 39, 60, .05)" } } },
  },
});

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
