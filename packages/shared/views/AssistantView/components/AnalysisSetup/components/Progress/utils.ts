import { TOTAL_FIELDS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";

/**
 * Progress through the setup as a percentage, for the progress bar.
 * @param setCount - Number of set fields.
 * @returns Percentage from 0 to 100.
 */
export function getProgressValue(setCount: number): number {
  return (setCount / TOTAL_FIELDS) * 100;
}
