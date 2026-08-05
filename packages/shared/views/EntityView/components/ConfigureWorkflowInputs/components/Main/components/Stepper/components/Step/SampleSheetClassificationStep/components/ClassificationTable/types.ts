import { type OnClassify } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/hooks/UseColumnClassification/types";
import { type ColumnClassifications } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { type OnConfigure } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
  onConfigure: OnConfigure;
}
