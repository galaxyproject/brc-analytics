import { ButtonProps, GridProps, MenuProps } from "@mui/material";
import { BUTTON_PROPS as MUI_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";

export const BUTTON_PROPS = {
  color: MUI_BUTTON_PROPS.COLOR.PRIMARY,
  variant: MUI_BUTTON_PROPS.VARIANT.CONTAINED,
} satisfies ButtonProps;

export const GRID_PROPS: Partial<GridProps> = {
  container: true,
  direction: "row",
  spacing: 2,
  wrap: "nowrap",
};

export const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: { horizontal: "left", vertical: "bottom" },
  transformOrigin: { horizontal: "left", vertical: "top" },
};
