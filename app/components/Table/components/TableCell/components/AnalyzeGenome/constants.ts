import { ButtonOwnProps, Grid2Props, MenuProps } from "@mui/material";

export const BUTTON_PROPS: Partial<ButtonOwnProps> = {
  color: "primary",
  variant: "contained",
};

export const GRID2_PROPS: Partial<Grid2Props> = {
  container: true,
  direction: "row",
  spacing: 2,
  wrap: "nowrap",
};

export const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: { horizontal: "left", vertical: "bottom" },
  transformOrigin: { horizontal: "left", vertical: "top" },
};
