import {
  ContrastPairs,
  OnAddPair,
  OnRemovePair,
  OnUpdatePair,
} from "../../hooks/UseExplicitContrasts/types";
import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";

export interface Props {
  factorValues: string[];
  mode: CONTRAST_MODE;
  onAddPair: OnAddPair;
  onRemovePair: OnRemovePair;
  onUpdatePair: OnUpdatePair;
  pairs: ContrastPairs;
}
