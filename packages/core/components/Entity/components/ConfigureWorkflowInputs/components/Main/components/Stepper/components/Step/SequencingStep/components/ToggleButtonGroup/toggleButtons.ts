import { ToggleButtonProps } from "@mui/material";
import { VIEW } from "./types";

export const TOGGLE_BUTTONS: ToggleButtonProps[] = [
  {
    children: "ENA",
    value: VIEW.ENA,
  },
  {
    children: "Upload my data",
    value: VIEW.UPLOAD_MY_DATA,
  },
];
