import {
  FormulaColumn,
  FormulaSelection,
  OnSelectPrimary,
  OnToggleCovariate,
} from "../../hooks/UseFormulaSelection/types";

export interface Props {
  columns: FormulaColumn[];
  onSelectPrimary: OnSelectPrimary;
  onToggleCovariate: OnToggleCovariate;
  selection: FormulaSelection;
}
