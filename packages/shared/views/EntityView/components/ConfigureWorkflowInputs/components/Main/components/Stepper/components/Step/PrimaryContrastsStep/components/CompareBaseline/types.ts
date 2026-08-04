import {
  type OnSelectBaseline,
  type OnToggleCompare,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseBaselineContrasts/types";
import { type CONTRAST_MODE } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

export interface Props {
  baseline: string | null;
  compare: Set<string>;
  factorValues: string[];
  mode: CONTRAST_MODE;
  onSelectBaseline: OnSelectBaseline;
  onToggleCompare: OnToggleCompare;
}
