import { createTheme, Theme, ThemeOptions } from "@mui/material";
import { deepmerge } from "@mui/utils";
import * as C from "./common/components";
import * as P from "./common/palette";

/**
 * Returns BRC customized theme.
 * @param theme - Base theme
 * @param themeOptions - Custom theme option overrides.
 * @returns theme with custom theme overrides.
 */
export function mergeAppTheme(
  theme: Theme,
  themeOptions?: ThemeOptions
): Theme {
  const defaultAppTheme = { ...theme };

  // Merge palette with hero color.
  defaultAppTheme.palette = { ...defaultAppTheme.palette, hero: P.hero };

  // Marge custom components.
  const components = {
    MuiButton: C.MuiButton(defaultAppTheme),
    MuiCssBaseline: C.MuiCssBaseline(defaultAppTheme),
  };

  const appTheme = createTheme(defaultAppTheme, { components });

  return createTheme(deepmerge(appTheme, { ...themeOptions }));
}
