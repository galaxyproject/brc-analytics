import { BRCDataCatalogGenome, BRCDataCatalogOrganism } from "./entities";
import { ORGANISM_PLOIDY, WORKFLOW_PLOIDY } from "./schema-entities";

export function getGenomeId(genome: BRCDataCatalogGenome): string {
  return sanitizeEntityId(genome.accession);
}

export function getGenomeTitle(genome?: BRCDataCatalogGenome): string {
  if (!genome) return "";
  return `${genome.taxonomicLevelSpecies}`;
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

/**
 * Get whether a given workflow ploidy is compatible with a given organism ploidy.
 * @param workflowPloidy - Workflow ploidy.
 * @param organismPloidy - Organism ploidy.
 * @returns boolean indicating whether the given ploidy values are compatible.
 */
export function workflowPloidyMatchesOrganismPloidy(
  workflowPloidy: WORKFLOW_PLOIDY,
  organismPloidy: ORGANISM_PLOIDY
): boolean {
  switch (workflowPloidy) {
    case WORKFLOW_PLOIDY.ANY:
      return true;
    case WORKFLOW_PLOIDY.DIPLOID:
      return organismPloidy === ORGANISM_PLOIDY.DIPLOID;
    case WORKFLOW_PLOIDY.HAPLOID:
      return organismPloidy === ORGANISM_PLOIDY.HAPLOID;
    case WORKFLOW_PLOIDY.POLYPLOID:
      return organismPloidy === ORGANISM_PLOIDY.POLYPLOID;
  }
}
