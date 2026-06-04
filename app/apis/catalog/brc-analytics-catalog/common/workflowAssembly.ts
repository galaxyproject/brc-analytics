/**
 * Determines whether a workflow's minimum assembly requirement can be met
 * given the number of compatible assemblies available.
 * Used by both the QC report and the UI workflow-list filter as the
 * single source of truth for this rule.
 * @param assemblyCountMin - Minimum assemblies required (0 = none required).
 * @param compatibleAssemblyCount - Number of compatible assemblies available.
 * @returns True if the requirement is met (user can run the workflow).
 */
export function workflowMeetsAssemblyMinimum(
  assemblyCountMin: number,
  compatibleAssemblyCount: number
): boolean {
  return assemblyCountMin === 0 || compatibleAssemblyCount >= assemblyCountMin;
}
