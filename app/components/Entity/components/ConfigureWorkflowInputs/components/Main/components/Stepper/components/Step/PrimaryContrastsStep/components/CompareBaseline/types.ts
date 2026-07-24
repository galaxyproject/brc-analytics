import {
  OnSelectBaseline,
  OnToggleCompare,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseBaselineContrasts/types";
import { CONTRAST_MODE } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

export interface Props {
  baseline: string | null;
  compare: Set<string>;
  factorValues: string[];
  mode: CONTRAST_MODE;
  onSelectBaseline: OnSelectBaseline;
  onToggleCompare: OnToggleCompare;
}
