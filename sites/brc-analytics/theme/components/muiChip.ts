import { PALETTE } from "@brc/styles/constants/palette";
import { CHIP_PROPS } from "@brc/styles/mui/muiChip";
import { type Components } from "@mui/material";
import { MuiChip as MuiChipBase } from "@repo/shared/theme/components/muiChip";
import {
  extractRoot,
  extractStyleOverrides,
  extractVariants,
} from "@repo/shared/theme/components/utils";

const baseRoot = extractRoot<"MuiChip">(MuiChipBase);
const baseStyleOverrides = extractStyleOverrides<"MuiChip">(MuiChipBase);
const baseVariants = extractVariants<"MuiChip">(MuiChipBase);

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
    ...baseStyleOverrides,
    root: {
      ...baseRoot,
      variants: [...baseVariants, VARIANT_COLOR_CAUTION],
    },
  },
};
