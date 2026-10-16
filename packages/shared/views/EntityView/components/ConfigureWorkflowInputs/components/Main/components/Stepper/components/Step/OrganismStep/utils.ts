import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { getOrganism } from "@repo/shared/services/workflows/entities";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

/**
 * Returns the species name of the configured organism.
 * @param configuredInput - Configured workflow inputs.
 * @param configuredInput.organism - Configured organism taxonomy ID.
 * @returns The species name, or undefined when no organism is configured.
 */
export function getOrganismSpecies({
  organism,
}: ConfiguredInput): string | undefined {
  if (!organism) return;
  return getOrganism(sanitizeEntityId(organism)).taxonomicLevelSpecies;
}
