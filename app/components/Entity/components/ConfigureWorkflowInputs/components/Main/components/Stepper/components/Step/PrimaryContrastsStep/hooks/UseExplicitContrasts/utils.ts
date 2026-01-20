import { ExplicitContrasts } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CONTRAST_MODE } from "../UseRadioGroup/types";
import { ContrastPair, ContrastPairs } from "./types";

/**
 * Creates an updater function to add a new empty pair with the given ID.
 * @param id - Unique ID for the new pair.
 * @returns Updater function.
 */
export function addPairUpdater(
  id: string
): (prev: ContrastPairs) => ContrastPairs {
  return (prev) => new Map(prev).set(id, ["", ""]);
}

/**
 * Builds the primary contrasts for EXPLICIT mode.
 * @param pairs - Map of contrast pairs.
 * @returns ExplicitContrasts object or null if no valid pairs.
 */
export function buildExplicitContrasts(
  pairs: ContrastPairs
): ExplicitContrasts | null {
  const validPairs = getValidPairs(pairs);

  if (validPairs.length === 0) return null;

  return { pairs: validPairs, type: CONTRAST_MODE.EXPLICIT };
}

/**
 * Creates a new initial pairs Map with one empty pair.
 * @returns New ContrastPairs Map.
 */
export function createInitialPairs(): ContrastPairs {
  return new Map([["0", ["", ""]]]);
}

/**
 * Computes which values should be disabled for a select based on existing pairs.
 * Prevents duplicate pairs (direction-agnostic) and self-pairs.
 * Also disables values that have no valid partners remaining.
 * @param factorValues - All available factor values.
 * @param pairs - Current map of all pairs.
 * @param currentPairId - ID of the pair being edited.
 * @param otherValue - Value in the other position of the current pair.
 * @returns Set of values that should be disabled.
 */
export function getDisabledValues(
  factorValues: string[],
  pairs: ContrastPairs,
  currentPairId: string,
  otherValue: string
): Set<string> {
  const disabled = new Set<string>();
  const usedKeys = getUsedPairKeys(pairs, currentPairId);

  // If no other value selected yet, disable values with no valid partners.
  if (!otherValue) {
    return new Set(
      factorValues.filter((value) =>
        hasNoValidPartner(value, factorValues, usedKeys)
      )
    );
  }

  // Disable the other value to prevent self-pair (A → A).
  disabled.add(otherValue);

  // Disable any value that would create a duplicate pair.
  for (const value of factorValues) {
    if (usedKeys.has(normalizePairKey(value, otherValue))) {
      disabled.add(value);
    }
  }

  return disabled;
}

/**
 * Calculates the maximum number of unique pairs for n values.
 * Formula: n choose 2 = n * (n - 1) / 2
 * @param n - Number of factor values.
 * @returns Maximum number of unique pairs.
 */
export function getMaxPairCount(n: number): number {
  if (n < 2) return 0;
  return (n * (n - 1)) / 2;
}

/**
 * Gets the next ID based on existing Map keys.
 * @param pairs - Current pairs Map.
 * @returns Next ID string.
 */
export function getNextId(pairs: ContrastPairs): string {
  if (pairs.size === 0) return "0";
  const maxKey = Math.max(...[...pairs.keys()].map(Number));
  return String(maxKey + 1);
}

/**
 * Gets normalized keys from all pairs, optionally excluding a specific pair.
 * @param pairs - Map of all pairs.
 * @param excludeId - Optional ID of pair to exclude.
 * @returns Set of normalized pair keys.
 */
export function getUsedPairKeys(
  pairs: ContrastPairs,
  excludeId?: string
): Set<string> {
  const keys = new Set<string>();
  for (const [id, [a, b]] of pairs) {
    if (id !== excludeId && a && b) {
      keys.add(normalizePairKey(a, b));
    }
  }
  return keys;
}

/**
 * Filters pairs to only include complete and valid pairs.
 * @param pairs - Map of contrast pairs.
 * @returns Array of valid pairs.
 */
export function getValidPairs(pairs: ContrastPairs): ContrastPair[] {
  return [...pairs.values()].filter(([a, b]) => a && b && a !== b);
}

/**
 * Checks if a value has no valid partners remaining.
 * A valid partner is one that is different and not already used in a pair.
 * @param value - The value to check.
 * @param factorValues - All available factor values.
 * @param usedKeys - Set of normalized keys for already used pairs.
 * @returns True if the value has no valid partners.
 */
export function hasNoValidPartner(
  value: string,
  factorValues: string[],
  usedKeys: Set<string>
): boolean {
  return factorValues.every(
    (partner) =>
      partner === value || usedKeys.has(normalizePairKey(value, partner))
  );
}

/**
 * Checks if all possible unique pair combinations have been used.
 * @param factorValues - All available factor values.
 * @param pairs - Current map of all pairs.
 * @returns True if all combinations are exhausted.
 */
export function isAllPairsUsed(
  factorValues: string[],
  pairs: ContrastPairs
): boolean {
  const maxPairs = getMaxPairCount(factorValues.length);
  const usedKeys = getUsedPairKeys(pairs);
  return usedKeys.size >= maxPairs;
}

/**
 * Creates a normalized key for a pair so that A,B and B,A produce the same key.
 * Uses null character as separator since it cannot appear in CSV/TSV data.
 * @param a - First value.
 * @param b - Second value.
 * @returns Normalized key string.
 */
export function normalizePairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

/**
 * Creates an updater function to remove a pair by ID.
 * If only one pair remains, resets to initial state to ensure at least one row.
 * @param id - ID of the pair to remove.
 * @returns Updater function.
 */
export function removePairUpdater(
  id: string
): (prev: ContrastPairs) => ContrastPairs {
  return (prev) => {
    // If there is only one pair, reset to initial state.
    if (prev.size <= 1) return createInitialPairs();

    // Otherwise, remove the pair.
    const next = new Map(prev);
    next.delete(id);
    return next;
  };
}

/**
 * Creates an updater function to update a specific position in a pair.
 * @param id - ID of the pair to update.
 * @param position - Position within the pair (0 or 1).
 * @param value - New value for the position.
 * @returns Updater function.
 */
export function updatePairUpdater(
  id: string,
  position: 0 | 1,
  value: string
): (prev: ContrastPairs) => ContrastPairs {
  return (prev) => {
    const existing = prev.get(id);
    if (!existing) return prev;
    const updated: ContrastPair = [...existing];
    updated[position] = value;
    return new Map(prev).set(id, updated);
  };
}

/**
 * Validates that at least one pair is complete and valid.
 * A valid pair has both values selected and they are different.
 * @param pairs - Map of contrast pairs.
 * @returns True if at least one valid pair exists.
 */
export function validatePairs(pairs: ContrastPairs): boolean {
  return getValidPairs(pairs).length > 0;
}
