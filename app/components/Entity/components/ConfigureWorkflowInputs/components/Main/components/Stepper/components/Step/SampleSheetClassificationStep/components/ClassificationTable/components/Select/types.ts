import { type OnClassify } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/hooks/UseColumnClassification/types";
import {
  type COLUMN_TYPE,
  type ColumnClassifications,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { type OnConfigure } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

export interface Props {
  classifications: ColumnClassifications;
  columnName: string;
  columnType: COLUMN_TYPE | null;
  onClassify: OnClassify;
  onConfigure: OnConfigure;
}
