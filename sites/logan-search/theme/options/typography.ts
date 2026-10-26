import { HEADING_FONT_FAMILY } from "@logan/theme/fonts";
import { type ThemeOptions } from "@mui/material";

// Only the family changes: findable-ui's sizes and weights are merged in
// underneath, so headings keep their rhythm. heading-xsmall is left on Inter
// because findable-ui uses it for card and panel titles that sit in body text.
export const typography: ThemeOptions["typography"] = {
  heading: { fontFamily: HEADING_FONT_FAMILY },
  "heading-large": { fontFamily: HEADING_FONT_FAMILY },
  "heading-small": { fontFamily: HEADING_FONT_FAMILY },
  "heading-xlarge": { fontFamily: HEADING_FONT_FAMILY },
};
