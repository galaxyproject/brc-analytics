import { STRANDEDNESS_LABELS } from "./constants";
import { Strandedness } from "./types";

/**
 * Get the label to display for a given strandedness value.
 * @param strandedness - Strandedness.
 * @returns Label for the strandedness value.
 */
export function getStepLabel(strandedness?: Strandedness): string {
  if (!strandedness) return "None";

  return STRANDEDNESS_LABELS[strandedness];
}
