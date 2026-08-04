import { type PaletteColorOptions, type ThemeOptions } from "@mui/material";

const CAUTION = {
  LIGHT: "#FFEB78",
  MAIN: "#956F00",
};

const PRIMARY = {
  DARK: "#1F1F47",
  MAIN: "#28285B",
};

const caution: PaletteColorOptions = {
  light: CAUTION.LIGHT,
  main: CAUTION.MAIN,
};

const primary: PaletteColorOptions = {
  contrastText: "#FFFFFF",
  dark: PRIMARY.DARK,
  main: PRIMARY.MAIN,
};

export const palette: ThemeOptions["palette"] = {
  caution,
  primary,
};
