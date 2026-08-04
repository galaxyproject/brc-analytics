import { type ORGANISM_PLOIDY } from "@repo/shared/apis/schema-types";
import { type MDXRemoteSerializeResult } from "next-mdx-remote";
import {
  type OUTBREAK_PRIORITY,
  type OUTBREAK_RESOURCE_TYPE,
} from "./schema-entities";

export type BRCCatalog =
  | BRCDataCatalogGenome
  | BRCDataCatalogOrganism
  | Outbreak;

export interface BRCDataCatalogGenome {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  commonNames: string[];
  coverage: string | null;
  galaxyDatacacheUrl: string | null;
  gcPercent: number | null;
  geneModelUrl: string | null;
  isRef: string;
  length: number;
  level: string;
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  otherTaxa: string[] | null;
  ploidy: ORGANISM_PLOIDY[];
  priority: OUTBREAK_PRIORITY | null;
  priorityPathogenName: string | null;
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
  taxonomicLevelIsolate: string;
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelRealm: string;
  taxonomicLevelSerotype: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
  ucscBrowserUrl: string | null;
}

export interface BRCDataCatalogOrganism {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  commonNames: string[];
  genomes: BRCDataCatalogGenome[];
  ncbiTaxonomyId: string;
  otherTaxa: string[] | null;
  priority: OUTBREAK_PRIORITY | null;
  priorityPathogenName: string | null;
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

export interface Outbreak {
  description: MDXRemoteSerializeResult;
  highlight_descendant_taxonomy_ids: number[] | null;
  name: string;
  priority: OUTBREAK_PRIORITY;
  resources: OutbreakResource[];
  taxonName?: string;
  taxonNameField?: string;
  taxonomy_id: number;
}

export interface OutbreakResource {
  title: string;
  type: OUTBREAK_RESOURCE_TYPE;
  url: string;
}
