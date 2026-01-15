import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfiguredInput } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { ContrastPairs, UseExplicitContrasts } from "./types";
import {
  addPairUpdater,
  createInitialPairs,
  getNextId,
  removePairUpdater,
  updatePairUpdater,
  validatePairs,
} from "./utils";

/**
 * Hook for managing explicit contrast pairs selection.
 * Resets pairs when primaryFactor changes.
 * @param primaryFactor - Primary factor column name from the previous step.
 * @returns Explicit contrasts state and handlers.
 */
export function useExplicitContrasts(
  primaryFactor: ConfiguredInput["primaryFactor"]
): UseExplicitContrasts {
  const [pairs, setPairs] = useState<ContrastPairs>(createInitialPairs);

  const valid = useMemo(() => validatePairs(pairs), [pairs]);

  const onAddPair = useCallback((): void => {
    setPairs((prev) => addPairUpdater(getNextId(prev))(prev));
  }, []);

  const onRemovePair = useCallback((id: string): void => {
    setPairs(removePairUpdater(id));
  }, []);

  const onUpdatePair = useCallback(
    (id: string, position: 0 | 1, value: string): void => {
      setPairs(updatePairUpdater(id, position, value));
    },
    []
  );

  useEffect(() => {
    setPairs(createInitialPairs());
  }, [primaryFactor]);

  return {
    onAddPair,
    onRemovePair,
    onUpdatePair,
    pairs,
    valid,
  };
}
