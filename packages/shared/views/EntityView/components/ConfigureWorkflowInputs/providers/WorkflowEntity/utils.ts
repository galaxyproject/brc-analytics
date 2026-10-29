import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";
import type { WorkflowEntityContextValue, WorkflowEntitySource } from "./types";

/**
 * Builds the WorkflowEntityContext value from a taxonomy source (assembly or organism).
 * @param source - Object with taxonomy fields, and an organism's genomes when the source is an organism.
 * @returns WorkflowEntityContextValue, or null if source is not available.
 */
export function buildWorkflowEntityValue(
  source?: WorkflowEntitySource
): WorkflowEntityContextValue | null {
  if (!source) return null;
  return {
    // Pages that don't list an organism's genomes embed them cut down to their
    // lineage taxonomy IDs, so only full assembly records are listed.
    assemblies: (source.genomes ?? []).filter(isAssembly),
    ncbiTaxonomyId: source.ncbiTaxonomyId,
    taxonomicLevelSpecies: source.taxonomicLevelSpecies,
  };
}

/**
 * Determines whether an organism genome is a full assembly record.
 * @param genome - Organism genome.
 * @returns True when the genome carries its assembly fields.
 */
function isAssembly(
  genome: NonNullable<OrganismContract["genomes"]>[number]
): genome is AssemblyContract {
  return "accession" in genome;
}
