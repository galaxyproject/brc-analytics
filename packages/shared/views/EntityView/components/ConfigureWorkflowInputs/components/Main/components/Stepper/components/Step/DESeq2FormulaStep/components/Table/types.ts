import {
  type FormulaColumn,
  type FormulaSelection,
  type OnSelectPrimary,
  type OnToggleCovariate,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/types";
import { type OnConfigure } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  columns: FormulaColumn[];
  onConfigure: OnConfigure;
  onSelectPrimary: OnSelectPrimary;
  onToggleCovariate: OnToggleCovariate;
  selection: FormulaSelection;
}
