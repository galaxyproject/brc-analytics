import { WORKFLOW_PLOIDY } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";

export interface SourceGenome {
  accession: string;
  annotationStatus: string;
  chromosomeCount: string;
  coverage: string;
  gcPercent: string;
  geneModelUrl: string;
  isRef: string;
  length: string;
  level: string;
  scaffoldCount: string;
  scaffoldL50: string;
  scaffoldN50: string;
  species: string;
  speciesTaxonomyId: string;
  strain: string;
  taxonomicGroup: string;
  taxonomyId: string;
  ucscBrowser: string;
}

export interface SourceWorkflowCategories {
  workflow_categories: {
    description: string;
    name: string;
    type: string;
  }[];
}

export interface SourceWorkflows {
  workflows: SourceWorkflow[];
}

export interface SourceWorkflow {
  ploidy: WORKFLOW_PLOIDY;
  trs_id: string;
  type: string;
  workflow_description: string;
  workflow_name: string;
}
