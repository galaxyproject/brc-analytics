import { PALETTE } from "@brc/styles/constants/palette";
import { CHIP_PROPS } from "@brc/styles/mui/muiChip";
import { type Components } from "@mui/material";
import {
  VARIANT_COLOR_ALERT,
  VARIANT_COLOR_DEFAULT,
  VARIANT_COLOR_NONE,
  VARIANT_COLOR_WARNING,
} from "@repo/shared/theme/components/muiChip";

const VARIANT_COLOR_CAUTION = {
  props: { color: CHIP_PROPS.COLOR.CAUTION },
  style: {
    backgroundColor: PALETTE.CAUTION_LIGHT,
    color: PALETTE.CAUTION_MAIN,
    // eslint-disable-next-line sort-keys -- disabling key order for readability
    "&:hover": { backgroundColor: PALETTE.CAUTION_LIGHT },
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
        VARIANT_COLOR_CAUTION,
      ],
    },
  },
};
