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

  // Check exactly one forward file URL
  const forwardFileUrlCount = values.filter(
    (v) => v === COLUMN_TYPE.FORWARD_FILE_URL
  ).length;
  if (forwardFileUrlCount === 0) {
    errors.push("One forward file URL column is required");
  } else if (forwardFileUrlCount > 1) {
    errors.push("Only one forward file URL column is allowed");
  }

  // Check exactly one reverse file URL
  const reverseFileUrlCount = values.filter(
    (v) => v === COLUMN_TYPE.REVERSE_FILE_URL
  ).length;
  if (reverseFileUrlCount === 0) {
    errors.push("One reverse file URL column is required");
  } else if (reverseFileUrlCount > 1) {
    errors.push("Only one reverse file URL column is allowed");
  }

  // Check at most one forward file MD5 (optional)
  const forwardFileMd5Count = values.filter(
    (v) => v === COLUMN_TYPE.FORWARD_FILE_MD5
  ).length;
  if (forwardFileMd5Count > 1) {
    errors.push("Only one forward file MD5 column is allowed");
  }

  // Check at most one reverse file MD5 (optional)
  const reverseFileMd5Count = values.filter(
    (v) => v === COLUMN_TYPE.REVERSE_FILE_MD5
  ).length;
  if (reverseFileMd5Count > 1) {
    errors.push("Only one reverse file MD5 column is allowed");
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
