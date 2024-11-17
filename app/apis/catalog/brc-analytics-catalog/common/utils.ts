import { BRCDataCatalogGenome } from "./entities";

export function getGenomeId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.accession);
}

export function getGenomeTitle(genome?: BRCDataCatalogGenome): string {
  if (!genome) return "";
  return `${genome.taxon}`;
}

export function sanitizeEntityId(entityId?: string): string {
  if (!entityId) return "";
  return entityId.replace(/\./g, "_");
}
