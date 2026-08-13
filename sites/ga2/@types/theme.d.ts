export {};

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
  }

  interface PaletteOptions {
    brand?: Partial<BrandColors>;
  }
}
