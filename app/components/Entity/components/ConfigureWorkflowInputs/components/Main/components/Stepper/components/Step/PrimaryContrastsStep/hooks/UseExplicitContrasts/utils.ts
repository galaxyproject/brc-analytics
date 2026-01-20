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
 * Filters pairs to only include complete and valid pairs.
 * @param pairs - Map of contrast pairs.
 * @returns Array of valid pairs.
 */
export function getValidPairs(pairs: ContrastPairs): ContrastPair[] {
  return [...pairs.values()].filter(([a, b]) => a && b && a !== b);
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
