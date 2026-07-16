import type { OrganismContract } from "@brc-analytics/core/apis/types";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";

/**
 * Projects a BRC or GA2 organism entity onto the shared organism shape consumed by
 * the side panel. Used in organism-scoped contexts with no selected assembly
 * (workflow-first and organism-first flows). The strain/serotype/isolate levels
 * are intentionally omitted: on the catalog organism those are aggregated across
 * all of the organism's assemblies, so without a specific assembly they would
 * list every value and mislead — only the species is meaningful here. Fields
 * absent on GA2's organism (priority, priority pathogen) resolve to undefined and
 * are not displayed.
 * @param organism - BRC or GA2 organism entity.
 * @returns Organism shape for the side panel.
 */
export function mapOrganismEntityToOrganism(
  organism: OrganismContract
): Organism {
  return {
    genomes: organism.genomes,
    ncbiTaxonomyId: organism.ncbiTaxonomyId,
    priority: organism.priority,
    priorityPathogenName: organism.priorityPathogenName,
    taxonomicLevelSpecies: organism.taxonomicLevelSpecies,
  };
}
