import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { WorkflowUrlParameter } from "../../../../utils/galaxy-api/entities";
import {
  ORGANISM_PLOIDY,
  OUTBREAK_PRIORITY,
  OUTBREAK_RESOURCE_TYPE,
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
} from "./schema-entities";

export type BRCCatalog =
  | BRCDataCatalogGenome
  | BRCDataCatalogOrganism
  | Outbreak;

export interface BRCDataCatalogGenome {
  accession: string;
  annotationStatus: string | null;
  chromosomes: number | null;
  commonName: string | null;
  coverage: string | null;
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
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelRealm: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string;
  ucscBrowserUrl: string | null;
}

export interface BRCDataCatalogOrganism {
  assemblyCount: number;
  assemblyTaxonomyIds: string[];
  commonName: string | null;
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
  taxonomicLevelKingdom: string;
  taxonomicLevelOrder: string;
  taxonomicLevelPhylum: string;
  taxonomicLevelRealm: string;
  taxonomicLevelSpecies: string;
  taxonomicLevelStrain: string[];
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

export interface WorkflowCategory {
  category: string;
  description: string;
  name: string;
  showComingSoon: boolean;
  workflows: Workflow[];
}

export interface Workflow {
  parameters: WorkflowParameter[];
  ploidy: WORKFLOW_PLOIDY;
  taxonomyId: string | null;
  trsId: string;
  workflowDescription: string;
  workflowName: string;
}

export interface WorkflowParameter {
  key: string;
  url_spec?: WorkflowUrlParameter;
  variable?: WORKFLOW_PARAMETER_VARIABLE;
}
