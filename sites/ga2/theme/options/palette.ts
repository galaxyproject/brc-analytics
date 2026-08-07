import {
  type Palette,
  type PaletteColorOptions,
  type ThemeOptions,
} from "@mui/material";

const BRAND = {
  ACCENT: "#007296",
  BURNT_SIENNA: "#B54F49",
  DARK_SIENNA: "#390900",
  RAW_SIENNA: "#D68A44",
  SURFACE: "#FAEDDC",
};

const brand: Palette["brand"] = {
  accent: BRAND.ACCENT,
  burntSienna: BRAND.BURNT_SIENNA,
  darkSienna: BRAND.DARK_SIENNA,
  rawSienna: BRAND.RAW_SIENNA,
  surface: BRAND.SURFACE,
};

const primary: PaletteColorOptions = {
  contrastText: "#FFFFFF",
  dark: BRAND.DARK_SIENNA,
  main: BRAND.BURNT_SIENNA,
};

export const palette: ThemeOptions["palette"] = {
  brand,
  primary,
};
