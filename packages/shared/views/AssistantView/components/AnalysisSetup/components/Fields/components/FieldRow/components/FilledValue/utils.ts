import type { SchemaFieldState } from "@repo/shared/services/api-client/types";
import type { SchemaFieldKey } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

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
