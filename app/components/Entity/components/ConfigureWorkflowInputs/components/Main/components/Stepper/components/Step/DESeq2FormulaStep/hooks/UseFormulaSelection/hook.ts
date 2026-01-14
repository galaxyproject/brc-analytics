import { useCallback, useMemo, useState } from "react";
import { COLUMN_TYPE } from "../../../SampleSheetClassificationStep/types";
import { DEFAULT_SELECTION } from "./constants";
import { FormulaSelection, UseFormulaSelection } from "./types";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { getFormulaColumns } from "./utils";

/**
 * Hook for managing DESeq2 formula selection.
 * @param sampleSheetClassification - Column classifications from the previous step.
 * @returns Formula selection state and handlers.
 */
export function useFormulaSelection(
  sampleSheetClassification: ConfiguredInput["sampleSheetClassification"]
): UseFormulaSelection {
  const [selection, setSelection] =
    useState<FormulaSelection>(DEFAULT_SELECTION);

  // Filter columns to only those relevant for the formula
  const columns = useMemo(
    () => getFormulaColumns(sampleSheetClassification),
    [sampleSheetClassification]
  );

  // Handle primary selection (radio button)
  const onSelectPrimary = useCallback((columnName: string): void => {
    setSelection((prev) => {
      // Remove from covariates if it was selected there
      const newCovariates = new Set(prev.covariates);
      newCovariates.delete(columnName);
      return {
        covariates: newCovariates,
        primary: columnName,
      };
    });
  }, []);

  // Handle covariate toggle (checkbox)
  const onToggleCovariate = useCallback((columnName: string): void => {
    setSelection((prev) => {
      const newCovariates = new Set(prev.covariates);
      if (newCovariates.has(columnName)) {
        newCovariates.delete(columnName);
      } else {
        newCovariates.add(columnName);
      }
      return {
        ...prev,
        covariates: newCovariates,
      };
    });
  }, []);

  // Generate the formula
  // Order: technical blocking → other covariates → biological factors → primary
  const formula = useMemo((): string | null => {
    if (!selection.primary) return null;

    const technicalBlocking: string[] = [];
    const otherCovariates: string[] = [];
    const biologicalFactors: string[] = [];

    // Categorize covariates by their type
    for (const columnName of selection.covariates) {
      const column = columns.find((c) => c.columnName === columnName);
      if (!column) continue;

      switch (column.columnType) {
        case COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR:
          technicalBlocking.push(columnName);
          break;
        case COLUMN_TYPE.OTHER_COVARIATE:
          otherCovariates.push(columnName);
          break;
        case COLUMN_TYPE.BIOLOGICAL_FACTOR:
          biologicalFactors.push(columnName);
          break;
      }
    }

    // Build formula parts in order
    const formulaParts = [
      ...technicalBlocking,
      ...otherCovariates,
      ...biologicalFactors,
      selection.primary,
    ];

    return `~ ${formulaParts.join(" + ")}`;
  }, [columns, selection]);

  // Validation: must have exactly one primary selected
  const valid = selection.primary !== null;

  return {
    columns,
    formula,
    onSelectPrimary,
    onToggleCovariate,
    selection,
    valid,
  };
}
