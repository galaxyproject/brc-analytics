import { type Organism } from "./types";

/**
 * Returns the number of assemblies for an organism, defaulting to 0 when absent.
 * @param organism - Organism to get the assembly count from.
 * @returns The assembly count.
 */
export function getOrganismAssemblyCount(organism: Organism): number {
  return organism.assemblyCount ?? 0;
}

/**
 * Returns the taxonomic groups for an organism, defaulting to an empty array when absent.
 * @param organism - Organism to get the taxonomic groups from.
 * @returns The taxonomic groups.
 */
export function getOrganismTaxonomicGroup(organism: Organism): string[] {
  return organism.taxonomicGroup ?? [];
}
