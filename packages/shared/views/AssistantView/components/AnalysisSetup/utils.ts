import type {
  AnalysisSchema,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { FIELD_KEYS, FIELD_STATUS, PLACEHOLDER_FIELD } from "./constants";
import type { SchemaFieldKey } from "./types";

/**
 * Counts the fields the assistant has set.
 * @param schema - Current analysis schema, or null before the assistant has returned one.
 * @returns Number of set fields.
 */
export function countSetFields(schema: AnalysisSchema | null): number {
  return FIELD_KEYS.filter(
    (fieldKey) => getField(schema, fieldKey).status === FIELD_STATUS.FILLED
  ).length;
}

/**
 * Reads a field from the schema, falling back to an empty field before the
 * assistant has returned one.
 * @param schema - Current analysis schema, or null.
 * @param fieldKey - Schema field key.
 * @returns Field state.
 */
export function getField(
  schema: AnalysisSchema | null,
  fieldKey: SchemaFieldKey
): SchemaFieldState {
  return schema?.[fieldKey] ?? PLACEHOLDER_FIELD;
}
