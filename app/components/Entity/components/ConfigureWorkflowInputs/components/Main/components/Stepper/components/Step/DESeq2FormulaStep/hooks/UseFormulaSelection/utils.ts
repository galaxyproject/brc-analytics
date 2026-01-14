import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { COLUMN_TYPE } from "../../../SampleSheetClassificationStep/types";
import {
  CategorizedCovariates,
  FormulaColumn,
  FormulaSelection,
} from "./types";
import { FORMULA_COLUMN_TYPES } from "./constants";

/**
 * Builds a DESeq2 formula string from categorized covariates and primary.
 * Order: technical blocking -> other covariates -> biological factors -> primary.
 * @param categorized - The categorized covariates.
 * @param primary - The primary factor column name.
 * @returns The formula string.
 */
function buildFormulaString(
  categorized: CategorizedCovariates,
  primary: string
): string {
  const { biologicalFactors, otherCovariates, technicalBlocking } = categorized;

  const formulaParts = [
    ...technicalBlocking,
    ...otherCovariates,
    ...biologicalFactors,
    primary,
  ];

  return `~ ${formulaParts.join(" + ")}`;
}

/**
 * Categorizes covariates by their column type.
 * @param columns - The available formula columns.
 * @param covariates - The selected covariate column names.
 * @returns Covariates grouped by type.
 */
function categorizeCovariates(
  columns: FormulaColumn[],
  covariates: Set<string>
): CategorizedCovariates {
  const categorized: CategorizedCovariates = {
    biologicalFactors: [],
    otherCovariates: [],
    technicalBlocking: [],
  };

  for (const covariate of covariates) {
    const column = columns.find(({ columnName }) => columnName === covariate);
    if (!column) continue;

    switch (column.columnType) {
      case COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR:
        categorized.technicalBlocking.push(covariate);
        break;
      case COLUMN_TYPE.OTHER_COVARIATE:
        categorized.otherCovariates.push(covariate);
        break;
      case COLUMN_TYPE.BIOLOGICAL_FACTOR:
        categorized.biologicalFactors.push(covariate);
        break;
    }
  }

  return categorized;
}

/**
 * Generates a DESeq2 formula string from the selected columns.
 * Order: technical blocking → other covariates → biological factors → primary.
 * @param columns - The available formula columns.
 * @param selection - The current selection state.
 * @returns The formula string, or null if no primary is selected.
 */
export function generateFormula(
  columns: FormulaColumn[],
  selection: FormulaSelection
): string | null {
  if (!selection.primary) return null;

  const categorized = categorizeCovariates(columns, selection.covariates);
  return buildFormulaString(categorized, selection.primary);
}

/**
 * Filters the sample sheet classification to only include columns that are relevant to the formula.
 * @param sampleSheetClassification - The sample sheet classification from the previous step.
 * @returns An array of formula columns.
 */
export function getFormulaColumns(
  sampleSheetClassification: ConfiguredInput["sampleSheetClassification"]
): FormulaColumn[] {
  if (!sampleSheetClassification) return [];

  const formulaColumns: FormulaColumn[] = [];

  for (const [columnName, columnType] of Object.entries(
    sampleSheetClassification
  )) {
    if (columnType === null) continue;
    if (!FORMULA_COLUMN_TYPES.has(columnType)) continue;

    // We only add columns that are the correct type.
    formulaColumns.push({ columnName, columnType });
  }

  return formulaColumns;
}

/**
 * Returns an updater function for selecting a primary column.
 * Removes the column from covariates if it was previously selected there.
 * @param columnName - The column name to set as primary.
 * @returns An updater function for use with setSelection.
 */
export function selectPrimary(
  columnName: string
): (prev: FormulaSelection) => FormulaSelection {
  return (prev) => {
    const covariates = new Set(prev.covariates);
    covariates.delete(columnName);
    return { covariates, primary: columnName };
  };
}

/**
 * Returns an updater function for toggling a covariate column.
 * Adds the column if not present, removes it if already selected.
 * @param columnName - The column name to toggle.
 * @returns An updater function for use with setSelection.
 */
export function toggleCovariate(
  columnName: string
): (prev: FormulaSelection) => FormulaSelection {
  return (prev) => {
    const covariates = new Set(prev.covariates);
    if (covariates.has(columnName)) {
      covariates.delete(columnName);
    } else {
      covariates.add(columnName);
    }
    return { ...prev, covariates };
  };
}
