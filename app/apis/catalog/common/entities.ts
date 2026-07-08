import type { OutbreakPriority as OUTBREAK_PRIORITY } from "../../../../catalog/schema/generated/schema";

/**
 * Site-neutral structural contract for an organism as consumed by the shared
 * OrganismView and the workflow side panel. Both BRCDataCatalogOrganism and
 * GA2OrganismEntity satisfy it structurally, and an assembly can be mapped into
 * it (see mapAssemblyToOrganism). Fields that GA2's organism (or the
 * assembly-derived case) lacks are optional; consumers must omit them from
 * display when undefined.
 */
export interface OrganismContract {
  genomes?: OrganismGenome[];
  ncbiTaxonomyId: string;
  priority?: OUTBREAK_PRIORITY | null;
  priorityPathogenName?: string | null;
  taxonomicLevelIsolate?: string[];
  taxonomicLevelSerotype?: string[];
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain?: string[];
}

interface OrganismGenome {
  lineageTaxonomyIds: string[];
}
