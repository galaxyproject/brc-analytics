import type {
  ClearableField,
  SchemaFieldState,
} from "@repo/shared/services/api-client/types";
import { FIELD_LABELS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/constants";
import type { SchemaFieldKey } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";
import { CLEARABLE_FIELDS } from "./constants";

/**
 * Chip label for a set field. An assembly shows its accession, which the
 * assistant carries in `detail`, rather than its fuller display value.
 * @param fieldKey - Schema field key.
 * @param field - Field state.
 * @returns Chip label.
 */
export function getFieldLabel(
  fieldKey: SchemaFieldKey,
  field: SchemaFieldState
): string {
  if (fieldKey === "assembly") return field.detail ?? field.value ?? "";
  return field.value ?? "";
}

/**
 * Accessible name for a removable chip, naming the action as well as the
 * value so assistive technology announces what the control does.
 * @param fieldKey - Schema field key.
 * @param label - Chip label.
 * @returns Accessible name, e.g. "Remove organism: Plasmodium falciparum".
 */
export function getRemoveLabel(
  fieldKey: SchemaFieldKey,
  label: string
): string {
  return `Remove ${FIELD_LABELS[fieldKey].toLowerCase()}: ${label}`;
}

/**
 * Whether the user can clear a field from the panel.
 * @param fieldKey - Schema field key.
 * @returns True for a field the user chose in conversation.
 */
export function isClearableField(
  fieldKey: SchemaFieldKey
): fieldKey is ClearableField {
  return CLEARABLE_FIELDS.has(fieldKey);
}
