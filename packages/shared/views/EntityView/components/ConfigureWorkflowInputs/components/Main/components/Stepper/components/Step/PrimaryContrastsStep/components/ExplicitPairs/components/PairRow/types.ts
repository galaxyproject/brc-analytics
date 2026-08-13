import {
  type ContrastPair,
  type ContrastPairs,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseExplicitContrasts/types";

export interface Props {
  factorValues: string[];
  onRemove: () => void;
  onUpdate: (position: 0 | 1, value: string) => void;
  pair: ContrastPair;
  pairId: string;
  pairs: ContrastPairs;
}
