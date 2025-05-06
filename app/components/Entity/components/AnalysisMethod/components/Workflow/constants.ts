import { ButtonProps, GridProps } from "@mui/material";
import { BUTTON_PROPS as MUI_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";

export const GRID_PROPS: GridProps = {
  container: true,
  direction: "column",
  spacing: 4,
  wrap: "nowrap",
};

export const BUTTON_PROPS = {
  color: MUI_BUTTON_PROPS.COLOR.PRIMARY,
  variant: MUI_BUTTON_PROPS.VARIANT.CONTAINED,
} satisfies ButtonProps;
