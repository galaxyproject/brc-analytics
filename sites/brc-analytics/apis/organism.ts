import { type BRCDataCatalogGenome } from "./assembly";
import { type OUTBREAK_PRIORITY } from "./schema-types";

export interface BRCDataCatalogOrganism {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  commonNames: string[];
  genomes: BRCDataCatalogGenome[];
  ncbiTaxonomyId: string;
  otherTaxa: string[] | null;
  priority: OUTBREAK_PRIORITY | null;
  priorityPathogenName: string | null;
  synonyms: string[];
  taxonomicGroup: string[];
  taxonomicLevelClass: string;
  taxonomicLevelDomain: string;
  taxonomicLevelFamily: string;
  taxonomicLevelGenus: string;
  taxonomicLevelIsolate: string[];
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelRealm: string;
  taxonomicLevelSerotype: string[];
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string[];
}
