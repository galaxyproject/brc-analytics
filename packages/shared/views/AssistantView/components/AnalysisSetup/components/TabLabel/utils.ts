import type { AnalysisSchema } from "@repo/shared/services/api-client/types";
import {
  countSetFields,
  countTotalFields,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";

/**
 * Text of the setup tab's label: its name and how many fields are set, out of
 * those the setup counts, as the panel's header does.
 * @param schema - Current analysis schema, or null before the assistant has returned one.
 * @returns Label text, e.g. "Setup 2/7".
 */
export function getTabLabel(schema: AnalysisSchema | null): string {
  return `Setup ${countSetFields(schema)}/${countTotalFields(schema)}`;
}
