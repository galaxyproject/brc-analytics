import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_SELECTION } from "./constants";
import { FormulaSelection, UseFormulaSelection } from "./types";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  generateFormula,
  getFormulaColumns,
  selectPrimary,
  toggleCovariate,
} from "./utils";

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

  // Grab the columns that are relevant to the formula.
  const columns = useMemo(
    () => getFormulaColumns(sampleSheetClassification),
    [sampleSheetClassification]
  );

  const formula = useMemo(
    () => generateFormula(columns, selection),
    [columns, selection]
  );

  const onSelectPrimary = useCallback((columnName: string): void => {
    setSelection(selectPrimary(columnName));
  }, []);

  const onToggleCovariate = useCallback((columnName: string): void => {
    setSelection(toggleCovariate(columnName));
  }, []);

  // Reset selection when classification changes.
  useEffect(() => {
    setSelection(DEFAULT_SELECTION);
  }, [sampleSheetClassification]);

  return {
    columns,
    formula,
    onSelectPrimary,
    onToggleCovariate,
    selection,
    valid: selection.primary !== null,
  };
}
