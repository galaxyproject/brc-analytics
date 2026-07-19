import {
  FormulaColumn,
  FormulaSelection,
  OnSelectPrimary,
  OnToggleCovariate,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/types";
import { OnConfigure } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  columns: FormulaColumn[];
  onConfigure: OnConfigure;
  onSelectPrimary: OnSelectPrimary;
  onToggleCovariate: OnToggleCovariate;
  selection: FormulaSelection;
}
