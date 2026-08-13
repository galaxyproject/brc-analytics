import {
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from "@mui/material";

export interface Props extends ToggleButtonGroupProps {
  toggleButtons: ToggleButtonProps[];
}
