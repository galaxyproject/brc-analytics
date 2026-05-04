import type { WorkflowEntityContextValue } from "./types";

/**
 * Builds the WorkflowEntityContext value from a taxonomy source (assembly or organism).
 * @param source - Object with taxonomy fields.
 * @returns WorkflowEntityContextValue, or null if source is not available.
 */
export function buildWorkflowEntityValue(
  source?: WorkflowEntityContextValue
): WorkflowEntityContextValue | null {
  if (!source) return null;
  return {
    ncbiTaxonomyId: source.ncbiTaxonomyId,
    taxonomicLevelSpecies: source.taxonomicLevelSpecies,
  };
}
