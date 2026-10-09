import { type PaletteColorOptions, type ThemeOptions } from "@mui/material";

// Borrowed from the coverage colormap the results map already draws with
// (plasma-like: violet, magenta, amber), so the chrome and the data read as
// one thing. Still a placeholder until there's a conversation with the Logan
// team about their own identity.

// Violet rather than BRC's navy-indigo, so the two sites don't blur together.
// MAIN on white is 8.5:1 and DARK 12.9:1, so either works for text, buttons
// and links; LIGHTEST is the selected-chip and hero-band tint.
export const PRIMARY = {
  DARK: "#3B1782",
  LIGHTEST: "#F2EEFB",
  MAIN: "#5B2BB5",
};

// Amber is an accent, not a surface. MAIN is too light for text on white
// (2.0:1), so it only ever carries ink text (7.1:1) or decoration; DARK is the
// amber that can be text (5.8:1 on white).
export const SECONDARY = {
  DARK: "#9A5306",
  MAIN: "#F0A93B",
};

// findable-ui's greys with a slight violet cast, so borders and panels sit
// with the primary instead of against it.
export const SMOKE = {
  DARK: "#C8C4D5",
  LIGHT: "#F5F4F8",
  LIGHTEST: "#FAFAFC",
  MAIN: "#E4E2EB",
};

const INK_MAIN = "#212B36";

const primary: PaletteColorOptions = {
  contrastText: "#FFFFFF",
  dark: PRIMARY.DARK,
  lightest: PRIMARY.LIGHTEST,
  main: PRIMARY.MAIN,
};

const secondary: PaletteColorOptions = {
  contrastText: INK_MAIN,
  dark: SECONDARY.DARK,
  main: SECONDARY.MAIN,
};

const smoke: PaletteColorOptions = {
  dark: SMOKE.DARK,
  light: SMOKE.LIGHT,
  lightest: SMOKE.LIGHTEST,
  main: SMOKE.MAIN,
};

export const palette: ThemeOptions["palette"] = {
  primary,
  secondary,
  smoke,
};
