import { ToggleButtonProps } from "@mui/material";
import { VIEW } from "./types";

export const TOGGLE_BUTTONS: ToggleButtonProps[] = [
  {
    children: "ENA",
    disabled: false,
    value: VIEW.ENA,
  },
  {
    children: "Upload my data",
    disabled: true,
    value: VIEW.UPLOAD_MY_DATA,
  },
];
