import type { OutbreakPriority as OUTBREAK_PRIORITY } from "../../../../catalog/schema/generated/schema";

/**
 * Site-neutral structural contract for an assembly as consumed by the shared
 * catalog viewModelBuilders. Both BRCDataCatalogGenome and GA2AssemblyEntity
 * satisfy it structurally; shared builders accept this contract rather than a
 * `BRCDataCatalogGenome | GA2AssemblyEntity` union so a field change in one
 * catalog cannot silently weaken type safety for the other.
 */
export interface AssemblyContract {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  coverage: string | null;
  galaxyDatacacheUrl: string | null;
  gcPercent: number | null;
  isRef: string;
  length: number;
  level: string;
  ncbiTaxonomyId: string;
  releaseDate: string;
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  strainName: string | null;
  taxonomicGroup: string[];
  taxonomicLevelClass: string;
  taxonomicLevelDomain: string;
  taxonomicLevelFamily: string;
  taxonomicLevelGenus: string;
  // Isolate/serotype are BRC-only assembly taxonomy fields; GA2 assemblies lack
  // them, so they are optional and consumers must default when absent.
  taxonomicLevelIsolate?: string;
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelSerotype?: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
  ucscBrowserUrl: string | null;
}

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
