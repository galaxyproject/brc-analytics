import type { OutbreakPriority as OUTBREAK_PRIORITY } from "../../../../catalog/schema/generated/schema";
import type { ORGANISM_PLOIDY } from "./schema-entities";

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
  // commonName is a BRC-only assembly field; GA2 assemblies lack it, so it is
  // optional and consumers must default when absent.
  commonName?: string | null;
  coverage: string | null;
  galaxyDatacacheUrl: string | null;
  gcPercent: number | null;
  isRef: string;
  length: number;
  level: string;
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  ploidy: ORGANISM_PLOIDY[];
  // Priority/priorityPathogenName are BRC-only assembly fields; GA2 assemblies
  // lack them, so they are optional and consumers must default when absent.
  priority?: OUTBREAK_PRIORITY | null;
  priorityPathogenName?: string | null;
  releaseDate: string;
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  speciesTaxonomyId: string;
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
  // taxonomicLevelRealm is a BRC-only assembly field; GA2 assemblies lack it, so
  // it is optional and consumers must default when absent.
  taxonomicLevelRealm?: string;
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
  // assemblyCount/assemblyTaxonomyIds/taxonomicGroup are organism-entity fields
  // absent on the assembly-derived projection, so they are optional and
  // consumers must default when absent.
  assemblyCount?: number;
  assemblyTaxonomyIds?: string[];
  genomes?: OrganismGenome[];
  ncbiTaxonomyId: string;
  priority?: OUTBREAK_PRIORITY | null;
  priorityPathogenName?: string | null;
  taxonomicGroup?: string[];
  taxonomicLevelIsolate?: string[];
  taxonomicLevelSerotype?: string[];
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain?: string[];
}

interface OrganismGenome {
  lineageTaxonomyIds: string[];
}
