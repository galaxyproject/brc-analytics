import type {
  FieldStatus,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import type { FieldGroup } from "./components/Fields/components/FieldGroup/types";

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
 * Number of fields the panel tracks, the denominator of its "n of N set" count.
 */
export const TOTAL_FIELDS = FIELD_KEYS.length;
