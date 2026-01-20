import {
  OnSelectBaseline,
  OnToggleCompare,
} from "../../hooks/UseBaselineContrasts/types";
import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";

export interface Props {
  baseline: string | null;
  compare: Set<string>;
  factorValues: string[];
  mode: CONTRAST_MODE;
  onSelectBaseline: OnSelectBaseline;
  onToggleCompare: OnToggleCompare;
}
