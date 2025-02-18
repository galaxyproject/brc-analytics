import { ORGANISM_PLOIDY, WORKFLOW_PLOIDY } from "./schema-entities";

export type BRCCatalog = BRCDataCatalogGenome;

export interface BRCDataCatalogGenome {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  coverage: string | null;
  gcPercent: number;
  geneModelUrl: string | null;
  isRef: string;
  length: number;
  level: string;
  ncbiTaxonomyId: string;
  ploidy: ORGANISM_PLOIDY;
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  species: string;
  speciesTaxonomyId: string;
  strain: string | null;
  taxonomicGroup: string[];
  taxonomicLevelClass: string | null;
  taxonomicLevelFamily: string | null;
  taxonomicLevelGenus: string | null;
  taxonomicLevelKingdom: string | null;
  taxonomicLevelOrder: string | null;
  taxonomicLevelOther: string | null;
  taxonomicLevelPhylum: string | null;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string | null;
  taxonomicLevelSuperkingdom: string | null;
  ucscBrowserUrl: string | null;
}

export interface BRCDataCatalogOrganism {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  genomes: BRCDataCatalogGenome[];
  ncbiTaxonomyId: string;
  taxonomicGroup: string[];
  taxonomicLevelClass: string | null;
  taxonomicLevelFamily: string | null;
  taxonomicLevelGenus: string | null;
  taxonomicLevelKingdom: string | null;
  taxonomicLevelOrder: string | null;
  taxonomicLevelOther: string[];
  taxonomicLevelPhylum: string | null;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string[];
  taxonomicLevelSuperkingdom: string | null;
}

export interface EntitiesResponse<R> {
  hits: R[];
  pagination: EntitiesResponsePagination;
  termFacets: Record<never, never>;
}

export interface EntitiesResponsePagination {
  count: number;
  pages: number;
  size: number;
  total: number;
}

export interface WorkflowCategory {
  category: string;
  description: string;
  name: string;
  workflows: Workflow[];
}

export interface Workflow {
  ploidy: WORKFLOW_PLOIDY;
  trsId: string;
  workflowDescription: string;
  workflowName: string;
}
