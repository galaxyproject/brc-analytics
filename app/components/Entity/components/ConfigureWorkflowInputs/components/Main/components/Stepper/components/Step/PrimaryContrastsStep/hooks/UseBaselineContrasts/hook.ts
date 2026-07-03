import { useCallback, useMemo, useState } from "react";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UseBaselineContrasts } from "./types";
import {
  buildBaselineContrasts,
  createInitialCompare,
  removeFromCompareUpdater,
  selectBaselineUpdater,
  toggleCompareUpdater,
  validateBaselineContrasts,
} from "./utils";

/**
 * Hook for managing baseline contrast selection.
 * Resets state when primaryFactor changes.
 * @param primaryFactor - Primary factor column name from the previous step.
 * @returns Baseline contrasts state and handlers.
 */
export function useBaselineContrasts(
  primaryFactor: ConfiguredInput["primaryFactor"]
): UseBaselineContrasts {
  const [baseline, setBaseline] = useState<string | null>(null);
  const [compare, setCompare] = useState<Set<string>>(createInitialCompare);

  // Reset state when primaryFactor changes. Adjusting state during render
  // (tracking the previous value) is React's recommended alternative to a
  // reset-in-effect — it avoids the extra commit + re-render.
  const [prevPrimaryFactor, setPrevPrimaryFactor] = useState(primaryFactor);
  if (primaryFactor !== prevPrimaryFactor) {
    setPrevPrimaryFactor(primaryFactor);
    setBaseline(null);
    setCompare(createInitialCompare());
  }

  const primaryContrasts = useMemo(
    () => buildBaselineContrasts(baseline, compare),
    [baseline, compare]
  );

  const valid = useMemo(
    () => validateBaselineContrasts(baseline, compare),
    [baseline, compare]
  );

  const onSelectBaseline = useCallback((value: string): void => {
    setBaseline(selectBaselineUpdater(value));
    setCompare(removeFromCompareUpdater(value));
  }, []);

  const onToggleCompare = useCallback((value: string): void => {
    setCompare(toggleCompareUpdater(value));
  }, []);

  return {
    baseline,
    compare,
    onSelectBaseline,
    onToggleCompare,
    primaryContrasts,
    valid,
  };
}
