import type {
  AnalysisSchema,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import {
  FIELD_KEYS,
  FIELD_STATUS,
  OPTIONAL_FIELDS,
  PLACEHOLDER_FIELD,
} from "./constants";
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
 * Counts the fields the setup still needs or already has: every field except
 * an optional one the chosen workflow doesn't need. The denominator of the
 * panel's "n of N set" count.
 * @param schema - Current analysis schema, or null before the assistant has returned one.
 * @returns Number of fields counted towards the setup.
 */
export function countTotalFields(schema: AnalysisSchema | null): number {
  return FIELD_KEYS.filter((fieldKey) => !isOptionalField(schema, fieldKey))
    .length;
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

/**
 * Whether a field is optional for the chosen workflow: a field a workflow may
 * not need, left empty once both a workflow and an assembly are chosen. The
 * assistant also leaves it empty when the workflow needs it but no assembly is
 * chosen yet, so until both are chosen it counts like any other field.
 * @param schema - Current analysis schema, or null.
 * @param fieldKey - Schema field key.
 * @returns True when the field is optional.
 */
export function isOptionalField(
  schema: AnalysisSchema | null,
  fieldKey: SchemaFieldKey
): boolean {
  return (
    OPTIONAL_FIELDS.includes(fieldKey) &&
    getField(schema, "workflow").status === FIELD_STATUS.FILLED &&
    getField(schema, "assembly").status === FIELD_STATUS.FILLED &&
    getField(schema, fieldKey).status === FIELD_STATUS.EMPTY
  );
}
