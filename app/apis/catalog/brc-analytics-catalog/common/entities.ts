import { WorkflowPloidy as WORKFLOW_PLOIDY } from "../../../../../catalog/schema/generated/schema";

export { WorkflowPloidy as WORKFLOW_PLOIDY } from "../../../../../catalog/schema/generated/schema";

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
  scaffoldCount: number | null;
  scaffoldL50: number | null;
  scaffoldN50: number | null;
  species: string;
  speciesTaxonomyId: string;
  strain: string | null;
  taxonomicGroup: string[];
  ucscBrowserUrl: string | null;
}

export interface BRCDataCatalogOrganism {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  genomes: BRCDataCatalogGenome[];
  ncbiTaxonomyId: string;
  species: string;
  taxonomicGroup: string[];
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
