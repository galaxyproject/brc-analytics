import type {} from "@mui/material/Button";
import { PaletteColorOptions } from "@mui/material/styles";

/**
 * Palette definitions.
 */
declare module "@mui/material/styles/createPalette" {
  interface Palette {
    hero: PaletteColor;
  }

  interface PaletteOptions {
    hero?: PaletteColorOptions;
  }
}

/**
 * Button prop options.
 */
declare module "@mui/material/Button" {
  interface ButtonClasses {
    containedHero: true;
  }
  interface ButtonPropsColorOverrides {
    hero: true;
  }
}

declare module "@emotion/react" {
  export interface Theme extends MTheme {
    name: "EmotionTheme";
  }
}
