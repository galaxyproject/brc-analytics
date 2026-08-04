import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { type Theme, type ThemeOptions } from "@mui/material";
import { deepmerge } from "@mui/utils";
import { components } from "./options/components";
import { palette } from "./options/palette";

/**
 * Builds the site theme, layering the site palette and component overrides over
 * the findable-ui base theme. Optional overrides (e.g. a page background) are
 * merged in before the theme is created.
 * @param overrides - Theme option overrides applied on top of the site options.
 * @returns Site theme.
 */
export function createGa2Theme(overrides?: ThemeOptions): Theme {
  // Overrides are the base so the site palette/components win on any shared key;
  // a page override only contributes keys the site does not define (e.g. background).
  return createAppTheme(deepmerge(overrides ?? {}, { components, palette }));
}
