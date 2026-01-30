import { BaselineContrasts } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CONTRAST_MODE } from "../UseRadioGroup/types";

/**
 * Builds the primary contrasts for BASELINE mode.
 * @param baseline - Selected baseline value.
 * @param compareSet - Set of values to compare.
 * @returns BaselineContrasts object or null if not configured.
 */
export function buildBaselineContrasts(
  baseline: string | null,
  compareSet: Set<string>
): BaselineContrasts | null {
  if (baseline === null || compareSet.size === 0) return null;

  const compare = [...compareSet];

  return { baseline, compare, type: CONTRAST_MODE.BASELINE };
}

/**
 * Creates the initial empty compare set.
 * @returns New empty Set.
 */
export function createInitialCompare(): Set<string> {
  return new Set();
}

/**
 * Creates an updater function to remove a value from compare set if present.
 * Used when selecting a new baseline to ensure it's not in compare.
 * @param value - The value to remove.
 * @returns Updater function.
 */
export function removeFromCompareUpdater(
  value: string
): (prev: Set<string>) => Set<string> {
  return (prev) => {
    if (!prev.has(value)) return prev;
    const next = new Set(prev);
    next.delete(value);
    return next;
  };
}

/**
 * Creates an updater function to select a baseline value.
 * @param value - The value to set as baseline.
 * @returns Updater function.
 */
export function selectBaselineUpdater(
  value: string
): (prev: string | null) => string {
  return () => value;
}

/**
 * Creates an updater function to toggle a value in the compare set.
 * @param value - The value to toggle.
 * @returns Updater function.
 */
export function toggleCompareUpdater(
  value: string
): (prev: Set<string>) => Set<string> {
  return (prev) => {
    const next = new Set(prev);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next;
  };
}

/**
 * Validates baseline contrasts selection.
 * @param baseline - Selected baseline value.
 * @param compareSet - Set of values to compare.
 * @returns True if selection is valid.
 */
export function validateBaselineContrasts(
  baseline: string | null,
  compareSet: Set<string>
): boolean {
  return baseline !== null && compareSet.size > 0;
}
