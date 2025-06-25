import { PaletteColorOptions, PaletteOptions } from "@mui/material";

/**
 * Palette "Caution"
 */
const CAUTION = {
  LIGHT: "#FFEB78",
  MAIN: "#956F00",
};

/**
 * Palette "Primary"
 */
const PRIMARY = {
  DARK: "#1F1F47",
  MAIN: "#28285B",
};

/**
 * Palette Option "Caution"
 */
const caution: PaletteColorOptions = {
  light: CAUTION.LIGHT,
  main: CAUTION.MAIN,
};

/**
 * Palette Option "Primary"
 */
const primary: PaletteColorOptions = {
  contrastText: "#FFFFFF",
  dark: PRIMARY.DARK,
  main: PRIMARY.MAIN,
};

/**
 * App Palette
 */
export const palette: PaletteOptions = {
  caution,
  primary,
};
