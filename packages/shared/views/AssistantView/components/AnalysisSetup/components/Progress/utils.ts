import type { AnalysisSchema } from "@repo/shared/services/api-client/types";
import {
  countSetFields,
  countTotalFields,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";

/**
 * Progress through the setup as a percentage, for the progress bar.
 * @param schema - Current analysis schema, or null before the assistant has returned one.
 * @returns Percentage from 0 to 100.
 */
export function getProgressValue(schema: AnalysisSchema | null): number {
  return (countSetFields(schema) / countTotalFields(schema)) * 100;
}
