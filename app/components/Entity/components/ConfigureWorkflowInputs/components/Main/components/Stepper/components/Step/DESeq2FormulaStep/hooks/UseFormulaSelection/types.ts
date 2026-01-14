import { COLUMN_TYPE } from "../../../SampleSheetClassificationStep/types";

export interface CategorizedCovariates {
  biologicalFactors: string[];
  otherCovariates: string[];
  technicalBlocking: string[];
}

export interface FormulaColumn {
  columnName: string;
  columnType: COLUMN_TYPE;
}

export interface FormulaSelection {
  covariates: Set<string>;
  primary: string | null;
}

export type OnSelectPrimary = (columnName: string) => void;

export type OnToggleCovariate = (columnName: string) => void;

export interface UseFormulaSelection {
  columns: FormulaColumn[];
  formula: string | null;
  onSelectPrimary: OnSelectPrimary;
  onToggleCovariate: OnToggleCovariate;
  selection: FormulaSelection;
  valid: boolean;
}
