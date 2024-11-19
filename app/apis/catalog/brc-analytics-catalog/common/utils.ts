import { BRCDataCatalogGenome, BRCDataCatalogOrganism } from "./entities";

export function getGenomeId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.accession);
}

export function getGenomeTitle(genome?: BRCDataCatalogGenome): string {
  if (!genome) return "";
  return `${genome.taxon}`;
}

export function getOrganismId(organism: BRCDataCatalogOrganism): string {
  return sanitizeEntityId(organism.ncbiTaxonomyId);
}

export function sanitizeEntityId(entityId?: string): string {
  if (!entityId) return "";
  return entityId.replace(/\./g, "_");
}
