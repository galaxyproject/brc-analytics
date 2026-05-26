import { RadioGroupProps, RadioProps } from "@mui/material";
import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";

export type Props = Pick<RadioGroupProps, "onChange" | "value"> &
  Pick<RadioProps, "disabled">;

export interface RadioGroupOption {
  description: string;
  label: string;
  value: CONTRAST_MODE;
}
