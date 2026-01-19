import { COLUMN_TYPE, ColumnClassifications } from "../../types";
import { VALIDATION_LABELS } from "./constants";

/**
 * Computes validation rules from the current classifications.
 * @param classifications - The column classifications map.
 * @returns Array of tuples of boolean and string for each validation rule.
 */
export function mapValidation(
  classifications: ColumnClassifications
): [boolean, string][] {
  const classificationSet = new Set(Object.values(classifications));
  return [
    [
      classificationSet.has(COLUMN_TYPE.IDENTIFIER),
      VALIDATION_LABELS.IDENTIFIER,
    ],
    [
      classificationSet.has(COLUMN_TYPE.FORWARD_FILE_PATH),
      VALIDATION_LABELS.FORWARD_FILE_PATH,
    ],
    [
      classificationSet.has(COLUMN_TYPE.REVERSE_FILE_PATH),
      VALIDATION_LABELS.REVERSE_FILE_PATH,
    ],
    [
      classificationSet.has(COLUMN_TYPE.BIOLOGICAL_FACTOR),
      VALIDATION_LABELS.BIOLOGICAL_FACTOR,
    ],
    [!classificationSet.has(null), "All columns classified"],
  ];
}
