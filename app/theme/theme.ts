import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { Theme, ThemeOptions } from "@mui/material";
import { deepmerge } from "@mui/utils";
import { palette } from "./common/palette";
import { components } from "./common/components";

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

  return createAppTheme({
    ...customOptions,
    components,
  });
}
