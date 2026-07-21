import type { OutbreakPriority as OUTBREAK_PRIORITY } from "../../../catalog/schema/generated/schema";
import type { ORGANISM_PLOIDY } from "./schema-types";

/**
 * Structural contract for an assembly as consumed by the shared catalog
 * viewModelBuilders. A concrete catalog assembly type satisfies it
 * structurally, so shared builders accept this contract rather than any one
 * catalog's assembly type — a field change in one catalog cannot silently
 * weaken type safety for another.
 */
export interface AssemblyContract {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  // Optional fields are absent on some catalogs' assemblies; consumers must
  // default when absent.
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
  taxonomicLevelIsolate?: string;
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelRealm?: string;
  taxonomicLevelSerotype?: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
  ucscBrowserUrl: string | null;
}

/**
 * Structural contract for an organism as consumed by the shared OrganismView
 * and the workflow side panel. A concrete catalog organism type satisfies it
 * structurally, and an assembly can be projected into it. Fields that a given
 * source lacks are optional; consumers must omit them from display when
 * undefined.
 */
export interface OrganismContract {
  // Optional fields are absent on the assembly-derived projection; consumers
  // must default when absent.
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
