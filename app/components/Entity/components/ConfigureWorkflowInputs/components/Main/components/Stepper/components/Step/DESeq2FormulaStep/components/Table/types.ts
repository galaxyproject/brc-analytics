import { OnConfigure } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  FormulaColumn,
  FormulaSelection,
  OnSelectPrimary,
  OnToggleCovariate,
} from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/types";

export interface Props {
  columns: FormulaColumn[];
  onConfigure: OnConfigure;
  onSelectPrimary: OnSelectPrimary;
  onToggleCovariate: OnToggleCovariate;
  selection: FormulaSelection;
}
