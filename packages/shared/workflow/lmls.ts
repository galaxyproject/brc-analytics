import { LEXICMAP } from "@repo/shared/workflow/lexicmap";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";

/**
 * The LMLS workflows, which aren't in the catalog — they're declared here and
 * appended to the catalog's own. The single membership list, so gating,
 * listing and Galaxy landing can't drift from each other.
 */
export const LMLS_WORKFLOWS = [LOGAN_SEARCH, LEXICMAP];

/**
 * Determines whether a TRS ID identifies an LMLS workflow.
 * @param trsId - TRS ID of the workflow.
 * @returns True when the TRS ID is one of the LMLS workflows'.
 */
export function isLmlsWorkflow(trsId: string): boolean {
  return LMLS_WORKFLOWS.some((workflow) => workflow.trsId === trsId);
}
