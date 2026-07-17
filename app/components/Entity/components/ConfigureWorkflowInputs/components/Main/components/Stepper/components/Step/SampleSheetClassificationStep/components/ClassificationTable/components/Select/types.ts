import { OnConfigure } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { OnClassify } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/hooks/UseColumnClassification/types";
import {
  COLUMN_TYPE,
  ColumnClassifications,
} from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

export interface Props {
  classifications: ColumnClassifications;
  columnName: string;
  columnType: COLUMN_TYPE | null;
  onClassify: OnClassify;
  onConfigure: OnConfigure;
}
