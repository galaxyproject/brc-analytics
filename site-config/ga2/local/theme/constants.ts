import { PaletteColorOptions, ThemeOptions } from "@mui/material";

/**
 * Palette "Primary"
 */
const PRIMARY = {
  DARK: "#390900",
  MAIN: "#B54F49",
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
