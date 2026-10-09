import { type PaletteColorOptions, type ThemeOptions } from "@mui/material";

// Placeholder: a neutral palette with one accent until there's a real visual
// pass (and a conversation with the Logan team about their own identity).
const PRIMARY = {
  DARK: "#0E3B3A",
  MAIN: "#155E5C",
};

const primary: PaletteColorOptions = {
  contrastText: "#FFFFFF",
  dark: PRIMARY.DARK,
  main: PRIMARY.MAIN,
};

export const palette: ThemeOptions["palette"] = {
  primary,
};
