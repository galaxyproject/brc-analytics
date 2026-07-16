import {
  COLUMN_TYPE,
  ColumnClassifications,
} from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { ValidationResult } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/utils";

export type OnClassify = (columnName: string, columnType: COLUMN_TYPE) => void;

export interface UseColumnClassification {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
  validation: ValidationResult;
}
