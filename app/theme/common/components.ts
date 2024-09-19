import { TEXT_BODY_LARGE_400_2_LINES } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Components, Theme } from "@mui/material";

/**
 * MuiButton Component
 * @param theme - Theme.
 * @returns MuiButton component theme styles.
 */
export const MuiButton = (theme: Theme): Components["MuiButton"] => {
  return {
    styleOverrides: {
      containedHero: {
        boxShadow: `0px 1px 0px 0px rgba(0, 0, 0, 0.08), 0px -1px 0px 0px rgba(0, 0, 0, 0.20) inset`,
        color: theme.palette.common.white,
        // eslint-disable-next-line sort-keys -- disabling key order for readability
        "&:hover": {
          backgroundColor: theme.palette.hero.main,
          boxShadow: `0px 1px 0px 0px rgba(0, 0, 0, 0.08), 0px -1px 0px 0px rgba(0, 0, 0, 0.20) inset`,
        },
        // eslint-disable-next-line sort-keys -- disabling key order for readability
        "&:active": {
          backgroundColor: theme.palette.hero.main,
          boxShadow: "none",
        },
      },
    },
  };
};

/**
 * MuiCssBaseline Component
 * @param theme - Theme.
 * @returns MuiCssBaseline component theme styles.
 */
export const MuiCssBaseline = (theme: Theme): Components["MuiCssBaseline"] => {
  return {
    styleOverrides: {
      body: {
        ...theme.typography[TEXT_BODY_LARGE_400_2_LINES],
      },
    },
  };
};
