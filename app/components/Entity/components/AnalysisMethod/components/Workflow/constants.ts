import { ButtonProps, Grid2Props } from "@mui/material";
import {
  COLOR,
  VARIANT,
} from "@databiosphere/findable-ui/lib/styles/common/mui/button";

export const GRID2_PROPS: Grid2Props = {
  container: true,
  direction: "column",
  spacing: 4,
  wrap: "nowrap",
};

export const BUTTON_PROPS: Partial<ButtonProps> = {
  color: COLOR.PRIMARY,
  variant: VARIANT.CONTAINED,
};
