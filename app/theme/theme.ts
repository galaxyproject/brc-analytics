import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { createTheme, Theme, ThemeOptions } from "@mui/material";
import { deepmerge } from "@mui/utils";
import * as C from "./common/components";
import { palette } from "./common/palette";

/**
 * Returns BRC customized theme.
 * @param baseThemeOptions - Base theme options.
 * @param themeOptions - Custom theme option overrides.
 * @returns theme with custom theme overrides.
 */
export function mergeAppTheme(
  baseThemeOptions?: ThemeOptions,
  themeOptions?: ThemeOptions
): Theme {
  // Merge custom options (palette, shadows, typography).
  const customOptions = deepmerge(baseThemeOptions, {
    ...themeOptions,
    palette: { ...themeOptions?.palette, ...palette },
  });
  // Create base app theme with custom options.
  const baseAppTheme = createAppTheme(customOptions);
  // Merge app components with base app theme.
  const appTheme = createTheme(baseAppTheme, {
    components: {
      MuiButton: C.MuiButton,
      MuiButtonGroup: C.MuiButtonGroup,
      MuiChip: C.MuiChip,
      MuiCssBaseline: C.MuiCssBaseline(baseAppTheme),
    },
  });
  // Return app theme.
  return appTheme;
}
