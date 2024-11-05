import { PaletteColorOptions } from "@mui/material";

/**
 * Palette "Primary"
 */
const PRIMARY = {
  DARK: "#1F1F47",
  MAIN: "#28285B",
};

/**
 * Color constants
 */
const primaryDark = PRIMARY.DARK;
const primaryMain = PRIMARY.MAIN;

/**
 * Palette Option "Primary"
 */
export const primary: PaletteColorOptions = {
  contrastText: "#FFFFFF",
  dark: primaryDark,
  main: primaryMain,
};
