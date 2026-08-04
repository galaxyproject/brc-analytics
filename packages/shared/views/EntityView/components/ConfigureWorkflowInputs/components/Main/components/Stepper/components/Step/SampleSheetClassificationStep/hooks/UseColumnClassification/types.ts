import {
  type COLUMN_TYPE,
  type ColumnClassifications,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { type ValidationResult } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/utils";

export type OnClassify = (columnName: string, columnType: COLUMN_TYPE) => void;

export interface UseColumnClassification {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
  validation: ValidationResult;
}
