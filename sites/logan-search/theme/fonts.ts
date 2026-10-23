import { Schibsted_Grotesk } from "next/font/google";

// Headings only; body text stays on findable-ui's Inter. next/font serves the
// files from this site's own build, so a page view doesn't call out to Google,
// and its metric-matched fallback keeps the swap from shifting the layout.
const schibstedGrotesk = Schibsted_Grotesk({
  display: "swap",
  fallback: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const HEADING_FONT_FAMILY = schibstedGrotesk.style.fontFamily;
