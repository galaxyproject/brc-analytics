import { BULLETS_CLASSES } from "@brc-analytics/core/views/HomeView/components/Bullets/constants";
import { PaletteColorOptions, ThemeOptions } from "@mui/material";

/**
 * Active bullet accent.
 */
const BULLET_ACTIVE_COLOR = "#fc5e60";

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
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          [`&.${BULLETS_CLASSES.BULLET_ACTIVE} span`]: {
            backgroundColor: BULLET_ACTIVE_COLOR,
          },
        },
      },
    },
  },
  palette: {
    primary,
  },
};
