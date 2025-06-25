import { TEXT_BODY_LARGE_400_2_LINES } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Components, Theme } from "@mui/material";
import { COLOR_MIXES } from "@databiosphere/findable-ui/lib/styles/common/constants/colorMixes";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { CHIP_PROPS as APP_CHIP_PROPS } from "../../styles/common/mui/chip";
import { PALETTE as APP_PALETTE } from "../../styles/common/constants/palette";

/**
 * MuiButton Component
 * @returns MuiButton component theme styles.
 */
export const MuiButton: Components["MuiButton"] = {
  styleOverrides: {
    containedPrimary: {
      boxShadow: `0px 1px 0px 0px rgba(0, 0, 0, 0.08), 0px -1px 0px 0px rgba(0, 0, 0, 0.20) inset`,
      // eslint-disable-next-line sort-keys -- disabling key order for readability
      "&:hover": {
        boxShadow: `0px 1px 0px 0px rgba(0, 0, 0, 0.08), 0px -1px 0px 0px rgba(0, 0, 0, 0.20) inset`,
      },
      // eslint-disable-next-line sort-keys -- disabling key order for readability
      "&.Mui-disabled": {
        boxShadow: `0px 1px 0px 0px rgba(0, 0, 0, 0.08), 0px -1px 0px 0px rgba(0, 0, 0, 0.20) inset`,
      },
    },
    root: {
      variants: [
        {
          props: { size: BUTTON_PROPS.SIZE.LARGE },
          style: {
            padding: "10px 16px",
          },
        },
        {
          props: { size: BUTTON_PROPS.SIZE.MEDIUM },
          style: {
            padding: "8px 16px",
          },
        },
      ],
    },
  },
};

export const MuiButtonGroup: Components["MuiButtonGroup"] = {
  styleOverrides: {
    grouped: {
      "&.MuiButton-containedSecondary": {
        boxShadow: `inset 0 0 0 1px ${PALETTE.SMOKE_DARK}, 0 1px 0 0 ${COLOR_MIXES.COMMON_BLACK_08}`,
      },
    },
  },
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

/**
 * MuiChip Component
 * @param theme - Theme.
 * @returns MuiChip component theme styles.
 */
export const MuiChip: Components["MuiChip"] = {
  styleOverrides: {
    root: {
      variants: [
        {
          props: { color: APP_CHIP_PROPS.COLOR.ALERT },
          style: {
            backgroundColor: PALETTE.ALERT_LIGHT,
            color: PALETTE.WARNING_MAIN,
          },
        },
        {
          props: { color: APP_CHIP_PROPS.COLOR.CAUTION },
          style: {
            backgroundColor: APP_PALETTE.CAUTION_LIGHT,
            color: APP_PALETTE.CAUTION_MAIN,
          },
        },
      ],
    },
  },
};
