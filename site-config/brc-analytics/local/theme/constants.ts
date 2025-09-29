import { PaletteColorOptions, ThemeOptions } from "@mui/material";

/**
 * Palette "Primary"
 */
const PRIMARY = {
  DARK: "#1F1F47",
  MAIN: "#28285B",
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
 * Theme Options
 */
export const THEME_OPTIONS: ThemeOptions = {
  palette: {
    primary,
  },
};
