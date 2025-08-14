import { MenuProps } from "@mui/material";

export const MENU_PROPS: Omit<MenuProps, "anchorEl" | "onClose" | "open"> = {
  anchorOrigin: { horizontal: "left", vertical: "bottom" },
  transformOrigin: { horizontal: "left", vertical: "top" },
};
