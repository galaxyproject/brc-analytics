import { BRCDataCatalogGenome, BRCDataCatalogOrganism } from "./entities";

export function getGenomeId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.accession);
}

export function getGenomeTitle(genome?: BRCDataCatalogGenome): string {
  if (!genome) return "";
  return `${genome.species}`;
}

export function getOrganismId(organism: BRCDataCatalogOrganism): string {
  return sanitizeEntityId(organism.ncbiTaxonomyId);
}

/**
 * Get the ID of the organism entity associated with the given genome.
 * @param genome - Genome.
 * @returns organism ID.
 */
export function getGenomeOrganismId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.speciesTaxonomyId);
}

export function sanitizeEntityId(entityId?: string): string {
  if (!entityId) return "";
  return entityId.replace(/\./g, "_");
}
