"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiSelect: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiButton: {
      defaultProps: { variant: "contained", disableElevation: true },
    },
  },
});

export default theme;
