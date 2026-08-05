import { type RadioGroupProps, type RadioProps } from "@mui/material";
import { type CONTRAST_MODE } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

export type Props = Pick<RadioGroupProps, "onChange" | "value"> &
  Pick<RadioProps, "disabled">;

export interface RadioGroupOption {
  description: string;
  label: string;
  value: CONTRAST_MODE;
}
