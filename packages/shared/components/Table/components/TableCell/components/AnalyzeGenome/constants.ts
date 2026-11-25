import { type GridProps, type MenuProps } from "@mui/material";

export const GRID_PROPS: Partial<GridProps> = {
  alignSelf: "flex-start",
  container: true,
  direction: "row",
  spacing: 2,
  wrap: "nowrap",
};

export const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: { horizontal: "left", vertical: "bottom" },
  transformOrigin: { horizontal: "left", vertical: "top" },
};
