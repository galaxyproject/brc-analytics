import { sanitizeEntityId } from "../../common/utils";
import { BRCDataCatalogGenome, BRCDataCatalogOrganism } from "./entities";
import { GA2AssemblyEntity, GA2OrganismEntity } from "../../ga2/entities";
import { ORGANISM_PLOIDY, WORKFLOW_PLOIDY } from "./schema-entities";

export function getGenomeId(
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): string {
  return sanitizeEntityId(genome.accession);
}

export function getGenomeTitle(
  genome?: BRCDataCatalogGenome | GA2AssemblyEntity
): string {
  if (!genome) return "";
  return `${genome.taxonomicLevelSpecies}`;
}

export function getOrganismId(
  organism: BRCDataCatalogOrganism | GA2OrganismEntity
): string {
  return sanitizeEntityId(organism.ncbiTaxonomyId);
}

/**
 * Get the ID of the organism entity associated with the given genome.
 * @param genome - Genome.
 * @returns organism ID.
 */
export function getGenomeOrganismId(
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): string {
  return sanitizeEntityId(genome.speciesTaxonomyId);
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
