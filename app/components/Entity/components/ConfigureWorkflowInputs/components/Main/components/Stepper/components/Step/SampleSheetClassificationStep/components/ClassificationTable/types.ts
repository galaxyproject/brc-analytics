import { OnConfigure } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { OnClassify } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/hooks/UseColumnClassification/types";
import { ColumnClassifications } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

export interface Props {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
  onConfigure: OnConfigure;
}
