import { COLUMN_TYPE } from "../../../SampleSheetClassificationStep/types";
import { FormulaSelection } from "./types";

export const DEFAULT_SELECTION: FormulaSelection = {
  covariates: new Set(),
  primary: null,
};

export const FORMULA_COLUMN_TYPES = new Set([
  COLUMN_TYPE.BIOLOGICAL_FACTOR,
  COLUMN_TYPE.OTHER_COVARIATE,
  COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
]);
