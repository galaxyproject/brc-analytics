import { PaletteColorOptions } from "@mui/material/styles";

/**
 * Palette definitions.
 */
declare module "@mui/material/styles" {
  interface BrandColors {
    accent: string;
    burntSienna: string;
    darkSienna: string;
    rawSienna: string;
    surface: string;
  }

  interface Palette {
    brand: BrandColors;
    caution: PaletteColor;
  }

  interface PaletteOptions {
    brand?: Partial<BrandColors>;
    caution?: PaletteColorOptions;
  }
}

/**
 * Chip prop options.
 */
declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    alert: true;
    caution: true;
    none: true;
  }
}
