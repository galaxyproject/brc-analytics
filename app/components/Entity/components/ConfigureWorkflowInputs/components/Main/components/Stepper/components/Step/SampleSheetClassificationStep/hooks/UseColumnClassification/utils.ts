import { ColumnClassifications } from "../../types";
import { COLUMN_TYPE } from "../../types";

/**
 * Creates initial classifications map with all columns set to null.
 * @param columnNames - Array of column names.
 * @returns Map of column names to null classifications.
 */
export function initClassifications(
  columnNames: string[]
): ColumnClassifications {
  return new Map(columnNames.map((name) => [name, null]));
}

/**
 * Updates the classification for a specific column.
 * @param columnName - The name of the column to update.
 * @param columnType - The new classification for the column.
 * @returns A function that takes the current classifications and returns the updated classifications.
 */
export function updateClassification(
  columnName: string,
  columnType: COLUMN_TYPE | null
): (classifications: ColumnClassifications) => ColumnClassifications {
  return (classifications) => {
    const next = new Map(classifications);
    next.set(columnName, columnType);
    return next;
  };
}
