import { Components } from "@mui/material";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { CHIP_PROPS as APP_CHIP_PROPS } from "../../styles/common/mui/chip";
import { PALETTE as APP_PALETTE } from "../../styles/common/constants/palette";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { ThemeOptions } from "@mui/material";

const MuiChip: Components["MuiChip"] = {
  styleOverrides: {
    root: {
      variants: [
        {
          props: { color: APP_CHIP_PROPS.COLOR.ALERT },
          style: {
            backgroundColor: PALETTE.ALERT_LIGHT,
            color: PALETTE.WARNING_MAIN,
            // eslint-disable-next-line sort-keys -- disabling key order for readability
            "&:hover": { backgroundColor: PALETTE.ALERT_LIGHT },
          },
        },
        {
          props: { color: APP_CHIP_PROPS.COLOR.CAUTION },
          style: {
            backgroundColor: APP_PALETTE.CAUTION_LIGHT,
            color: APP_PALETTE.CAUTION_MAIN,
            // eslint-disable-next-line sort-keys -- disabling key order for readability
            "&:hover": { backgroundColor: APP_PALETTE.CAUTION_LIGHT },
          },
        },
        {
          props: { color: CHIP_PROPS.COLOR.DEFAULT },
          style: {
            "&:hover": { backgroundColor: PALETTE.SMOKE_MAIN },
          },
        },
        {
          props: { color: APP_CHIP_PROPS.COLOR.NONE },
          style: {
            backgroundColor: "transparent",
            color: PALETTE.INK_MAIN,
            // eslint-disable-next-line sort-keys -- disabling key order for readability
            "&:hover": { backgroundColor: "transparent" },
          },
        },
        {
          props: { color: CHIP_PROPS.COLOR.WARNING },
          style: {
            "&:hover": { backgroundColor: PALETTE.WARNING_LIGHT },
          },
        },
      ],
    },
  },
};

const MuiCssBaseline: Components["MuiCssBaseline"] = {
  styleOverrides: {
    body: {
      font: FONT.BODY_LARGE_400_2_LINES,
    },
  },
};

export const components: ThemeOptions["components"] = {
  MuiChip,
  MuiCssBaseline,
};
