import { CONTRAST_MODE } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";
import { RadioGroupProps, RadioProps } from "@mui/material";

export type Props = Pick<RadioGroupProps, "onChange" | "value"> &
  Pick<RadioProps, "disabled">;

export interface RadioGroupOption {
  description: string;
  label: string;
  value: CONTRAST_MODE;
}
