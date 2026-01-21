import {
  ContrastPair,
  ContrastPairs,
} from "../../../../hooks/UseExplicitContrasts/types";

export interface Props {
  factorValues: string[];
  onRemove: () => void;
  onUpdate: (position: 0 | 1, value: string) => void;
  pair: ContrastPair;
  pairId: string;
  pairs: ContrastPairs;
}
