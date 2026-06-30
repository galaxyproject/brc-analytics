import { useCallback, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset-on-dependency-change effect (react-hooks v7 anti-pattern); refactor tracked in #1393
    setBaseline(null);
    setCompare(createInitialCompare());
  }, [primaryFactor]);

  return {
    baseline,
    compare,
    onSelectBaseline,
    onToggleCompare,
    primaryContrasts,
    valid,
  };
}
