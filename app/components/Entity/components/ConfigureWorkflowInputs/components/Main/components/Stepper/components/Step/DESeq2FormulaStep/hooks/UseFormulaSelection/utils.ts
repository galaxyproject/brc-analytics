import { ConfiguredInput } from "app/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { FormulaColumn } from "./types";
import { FORMULA_COLUMN_TYPES } from "./constants";

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
