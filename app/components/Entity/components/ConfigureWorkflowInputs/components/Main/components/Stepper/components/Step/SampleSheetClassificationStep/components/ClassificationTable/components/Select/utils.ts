import { COLUMN_TYPE, ColumnClassifications } from "../../../../types";
import { SINGLE_SELECT_TYPES } from "./constants";

/**
 * Returns a set of single-select types that are already used in the classifications
 * @param classifications - Classifications.
 * @returns Set of single-select types
 */
const getUsedSingleSelectTypes = (
  classifications: ColumnClassifications
): Set<COLUMN_TYPE> =>
  new Set(
    Array.from(classifications.values()).filter(
      (type): type is COLUMN_TYPE =>
        type !== null && SINGLE_SELECT_TYPES.has(type)
    )
  );

/**
 * Returns true if the option should be disabled.
 * @param optionValue - Option value.
 * @param currentColumnType - Current column type.
 * @param classifications - Classifications.
 * @returns True if the option should be disabled.
 */
export function isOptionDisabled(
  optionValue: COLUMN_TYPE,
  currentColumnType: COLUMN_TYPE | null,
  classifications: ColumnClassifications
): boolean {
  // Don't disable if this is the current column's selection
  if (optionValue === currentColumnType) return false;

  // Disable if it's a single-select type that's already used
  const usedSingleSelectTypes = getUsedSingleSelectTypes(classifications);
  return usedSingleSelectTypes.has(optionValue);
}
