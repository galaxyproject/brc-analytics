import { ClassificationMap, COLUMN_TYPE } from "../../types";

/**
 * Auto-detect MD5 column type from column name.
 * Looks for "MD5" in the name and "1"/"2" to determine forward/reverse.
 * @param columnName - The column name to check.
 * @returns The detected COLUMN_TYPE or null if not an MD5 column.
 */
function detectMd5ColumnType(columnName: string): COLUMN_TYPE | null {
  const lowerName = columnName.toLowerCase();
  if (!lowerName.includes("md5")) return null;

  // Look for "1" or "2" to determine forward/reverse
  if (lowerName.includes("1")) return COLUMN_TYPE.FORWARD_FILE_MD5;
  if (lowerName.includes("2")) return COLUMN_TYPE.REVERSE_FILE_MD5;

  return null;
}

/**
 * Creates initial classifications map with all columns set to null,
 * except for auto-detected MD5 columns.
 * @param columnNames - Array of column names.
 * @returns Map of column names to classifications (null or auto-detected MD5 type).
 */
export function initClassifications(columnNames: string[]): ClassificationMap {
  return new Map(columnNames.map((name) => [name, detectMd5ColumnType(name)]));
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
): (classifications: ClassificationMap) => ClassificationMap {
  return (classifications) => {
    const next = new Map(classifications);
    next.set(columnName, columnType);
    return next;
  };
}
