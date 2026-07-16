import {
  ContrastPairs,
  OnAddPair,
  OnRemovePair,
  OnUpdatePair,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";
import { CONTRAST_MODE } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

export interface Props {
  factorValues: string[];
  mode: CONTRAST_MODE;
  onAddPair: OnAddPair;
  onRemovePair: OnRemovePair;
  onUpdatePair: OnUpdatePair;
  pairs: ContrastPairs;
}
