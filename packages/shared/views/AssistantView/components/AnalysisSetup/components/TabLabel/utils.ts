import type { AnalysisSchema } from "@repo/shared/services/api-client/types";
import { TOTAL_FIELDS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";
import { countSetFields } from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";

/**
 * Text of the setup tab's label: its name and how many fields are set.
 * @param schema - Current analysis schema, or null before the assistant has returned one.
 * @returns Label text, e.g. "Setup 2/7".
 */
export function getTabLabel(schema: AnalysisSchema | null): string {
  return `Setup ${countSetFields(schema)}/${TOTAL_FIELDS}`;
}
