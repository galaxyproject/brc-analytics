import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";
import { RadioGroupProps } from "@mui/material";
import { RadioProps } from "@mui/material";

export type Props = Pick<RadioGroupProps, "onChange" | "value"> &
  Pick<RadioProps, "disabled">;

export interface RadioGroupOption {
  description: string;
  label: string;
  value: CONTRAST_MODE;
}
