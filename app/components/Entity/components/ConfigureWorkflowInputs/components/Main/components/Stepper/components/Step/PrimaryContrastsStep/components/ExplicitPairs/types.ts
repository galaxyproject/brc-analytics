import {
  type ContrastPairs,
  type OnAddPair,
  type OnRemovePair,
  type OnUpdatePair,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";
import { type CONTRAST_MODE } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

export interface Props {
  factorValues: string[];
  mode: CONTRAST_MODE;
  onAddPair: OnAddPair;
  onRemovePair: OnRemovePair;
  onUpdatePair: OnUpdatePair;
  pairs: ContrastPairs;
}
