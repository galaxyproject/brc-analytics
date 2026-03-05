import { Assembly } from "../../../../../../../../../../../../../views/WorkflowInputsView/types";
import { SPECIAL_CASE_ASSEMBLY_LOOKUP } from "./constants";

/**
 * Gets the assembly ID from the genome assembly information, applying any necessary special case lookups.
 * @param genome - Assembly entity.
 * @returns Assembly ID.
 */
export function getAssemblyId(genome?: Assembly): string | undefined {
  if (!genome) return undefined;

  return SPECIAL_CASE_ASSEMBLY_LOOKUP[genome.accession] ?? genome.accession;
}
