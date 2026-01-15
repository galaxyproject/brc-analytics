import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";

export interface RadioGroupOption {
  description: string;
  disabled: boolean;
  label: string;
  value: CONTRAST_MODE;
}
