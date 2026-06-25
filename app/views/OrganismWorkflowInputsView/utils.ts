import type { BRCDataCatalogOrganism } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import type { GA2OrganismEntity } from "../../apis/catalog/ga2/entities";
import type { Organism } from "../OrganismView/types";

/**
 * Projects a BRC or GA2 organism entity onto the shared organism shape consumed by
 * the side panel. Fields absent on GA2's organism (priority, priority pathogen,
 * strain, serotype, isolate) resolve to undefined and are not displayed.
 * @param organism - BRC or GA2 organism entity.
 * @returns Organism shape for the side panel.
 */
export function mapOrganismEntityToOrganism(
  organism: BRCDataCatalogOrganism | GA2OrganismEntity
): Organism {
  return {
    genomes: organism.genomes,
    ncbiTaxonomyId: organism.ncbiTaxonomyId,
    priority: "priority" in organism ? organism.priority : undefined,
    priorityPathogenName:
      "priorityPathogenName" in organism
        ? organism.priorityPathogenName
        : undefined,
    taxonomicLevelIsolate:
      "taxonomicLevelIsolate" in organism
        ? organism.taxonomicLevelIsolate
        : undefined,
    taxonomicLevelSerotype:
      "taxonomicLevelSerotype" in organism
        ? organism.taxonomicLevelSerotype
        : undefined,
    taxonomicLevelSpecies: organism.taxonomicLevelSpecies,
    taxonomicLevelStrain:
      "taxonomicLevelStrain" in organism
        ? organism.taxonomicLevelStrain
        : undefined,
  };
}
