import {
  ContrastPairs,
  OnAddPair,
  OnRemovePair,
  OnUpdatePair,
} from "../../hooks/UseExplicitContrasts/types";

export interface Props {
  factorValues: string[];
  onAddPair: OnAddPair;
  onRemovePair: OnRemovePair;
  onUpdatePair: OnUpdatePair;
  pairs: ContrastPairs;
}
