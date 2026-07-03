import { useCallback, useMemo, useState } from "react";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { FormulaSelection, UseFormulaSelection } from "./types";
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
  const [selection, setSelection] = useState<FormulaSelection>({
    covariates: new Set(),
    primary: null,
  });

  // Reset selection when the classification changes. Adjusting state during
  // render (tracking the previous value) is React's recommended alternative to
  // a reset-in-effect — it avoids the extra commit + re-render.
  const [prevClassification, setPrevClassification] = useState(
    sampleSheetClassification
  );
  if (sampleSheetClassification !== prevClassification) {
    setPrevClassification(sampleSheetClassification);
    setSelection({ covariates: new Set(), primary: null });
  }

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

  return {
    columns,
    formula,
    onSelectPrimary,
    onToggleCovariate,
    selection,
    valid: selection.primary !== null,
  };
}
