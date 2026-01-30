import { COLUMN_TYPE, ColumnClassifications } from "../../types";
import { ValidationResult } from "../../utils";

export type OnClassify = (columnName: string, columnType: COLUMN_TYPE) => void;

export interface UseColumnClassification {
  classifications: ColumnClassifications;
  onClassify: OnClassify;
  validation: ValidationResult;
}
