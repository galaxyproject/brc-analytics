import { RadioGroupProps } from "@mui/material";

export type Value = RadioGroupProps["value"];

export interface UseRadioGroup extends RadioGroupProps {
  onValueChange: (value: Value) => void;
}
