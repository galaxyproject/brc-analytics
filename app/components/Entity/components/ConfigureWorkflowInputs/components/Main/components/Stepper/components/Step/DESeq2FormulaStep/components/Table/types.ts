import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  FormulaColumn,
  FormulaSelection,
  OnSelectPrimary,
  OnToggleCovariate,
} from "../../hooks/UseFormulaSelection/types";

export interface Props {
  columns: FormulaColumn[];
  onConfigure: OnConfigure;
  onSelectPrimary: OnSelectPrimary;
  onToggleCovariate: OnToggleCovariate;
  selection: FormulaSelection;
}
