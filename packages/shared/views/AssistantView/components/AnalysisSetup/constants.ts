import type {
  FieldStatus,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import type { FieldGroup } from "./components/Fields/components/FieldGroup/types";
import type { SchemaFieldKey } from "./types";

/**
 * Setup panel sections, in display order, and the fields each holds.
 */
export const FIELD_GROUPS: FieldGroup[] = [
  { fields: ["organism", "assembly", "gene_annotation"], label: "Target" },
  { fields: ["analysis_type", "workflow"], label: "Analysis" },
  { fields: ["data_source", "data_characteristics"], label: "Data" },
];

/**
 * Every field the panel tracks, in display order.
 */
export const FIELD_KEYS = FIELD_GROUPS.flatMap(({ fields }) => fields);

/**
 * Status of an analysis schema field, as the assistant API reports it.
 */
export const FIELD_STATUS = {
  EMPTY: "empty",
  FILLED: "filled",
  NEEDS_ATTENTION: "needs_attention",
} as const satisfies Record<string, FieldStatus>;

/**
 * Stands in for every field before the assistant has returned a schema.
 * Frozen so the shared reference can't be mutated through any one field.
 */
export const PLACEHOLDER_FIELD: SchemaFieldState = Object.freeze({
  detail: null,
  status: FIELD_STATUS.EMPTY,
  value: null,
});

/**
 * Fields a workflow may not need. Once a workflow and an assembly are chosen,
 * the assistant fills (or flags) one of these when the workflow needs it and
 * leaves it empty when it doesn't.
 */
export const OPTIONAL_FIELDS: readonly SchemaFieldKey[] = ["gene_annotation"];
