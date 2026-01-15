import { COLUMN_TYPE, ColumnClassifications } from "./types";

export interface ValidationResult {
  errors: string[];
  valid: boolean;
}

/**
 * Validates the column classifications.
 * @param classifications - The column classifications to validate.
 * @returns The validation result with valid status and error messages.
 */
export function validateClassifications(
  classifications: ColumnClassifications
): ValidationResult {
  const errors: string[] = [];
  const values = Object.values(classifications);

  // Check all columns are classified
  const unclassifiedCount = values.filter((v) => v === null).length;
  if (unclassifiedCount > 0) {
    errors.push(`${unclassifiedCount} column(s) are not classified`);
  }

  // Check exactly one identifier
  const identifierCount = values.filter(
    (v) => v === COLUMN_TYPE.IDENTIFIER
  ).length;
  if (identifierCount === 0) {
    errors.push("One identifier column is required");
  } else if (identifierCount > 1) {
    errors.push("Only one identifier column is allowed");
  }

  // Check exactly one forward file path
  const forwardFilePathCount = values.filter(
    (v) => v === COLUMN_TYPE.FORWARD_FILE_PATH
  ).length;
  if (forwardFilePathCount === 0) {
    errors.push("One forward file path column is required");
  } else if (forwardFilePathCount > 1) {
    errors.push("Only one forward file path column is allowed");
  }

  // Check exactly one reverse file path
  const reverseFilePathCount = values.filter(
    (v) => v === COLUMN_TYPE.REVERSE_FILE_PATH
  ).length;
  if (reverseFilePathCount === 0) {
    errors.push("One reverse file path column is required");
  } else if (reverseFilePathCount > 1) {
    errors.push("Only one reverse file path column is allowed");
  }

  // Check at least one biological factor
  const biologicalFactorCount = values.filter(
    (v) => v === COLUMN_TYPE.BIOLOGICAL_FACTOR
  ).length;
  if (biologicalFactorCount === 0) {
    errors.push("At least one biological factor column is required");
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

/**
 * Extracts column names from sample sheet data.
 * @param sampleSheet - The sample sheet data.
 * @returns Array of column names.
 */
export function getColumnNames(
  sampleSheet: Record<string, string>[] | undefined
): string[] {
  if (!sampleSheet || sampleSheet.length === 0) return [];

  return Object.keys(sampleSheet[0]);
}
