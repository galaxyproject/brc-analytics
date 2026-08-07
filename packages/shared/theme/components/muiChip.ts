import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { CHIP_PROPS as DX_CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { type Components } from "@mui/material";
import { CHIP_PROPS } from "@repo/shared/styles/mui/muiChip";

export const VARIANT_COLOR_ALERT = {
  props: { color: CHIP_PROPS.COLOR.ALERT },
  style: {
    backgroundColor: PALETTE.ALERT_LIGHT,
    color: PALETTE.WARNING_MAIN,
    // eslint-disable-next-line sort-keys -- disabling key order for readability
    "&:hover": { backgroundColor: PALETTE.ALERT_LIGHT },
  },
};

export const VARIANT_COLOR_DEFAULT = {
  props: { color: DX_CHIP_PROPS.COLOR.DEFAULT },
  style: {
    "&:hover": { backgroundColor: PALETTE.SMOKE_MAIN },
  },
};

export const VARIANT_COLOR_NONE = {
  props: { color: CHIP_PROPS.COLOR.NONE },
  style: {
    backgroundColor: "transparent",
    color: PALETTE.INK_MAIN,
    // eslint-disable-next-line sort-keys -- disabling key order for readability
    "&:hover": { backgroundColor: "transparent" },
  },
};

export const VARIANT_COLOR_WARNING = {
  props: { color: DX_CHIP_PROPS.COLOR.WARNING },
  style: {
    "&:hover": { backgroundColor: PALETTE.WARNING_LIGHT },
  },
};

export const MuiChip: Components["MuiChip"] = {
  styleOverrides: {
    root: {
      variants: [
        VARIANT_COLOR_ALERT,
        VARIANT_COLOR_DEFAULT,
        VARIANT_COLOR_NONE,
        VARIANT_COLOR_WARNING,
      ],
    },
  },
};
