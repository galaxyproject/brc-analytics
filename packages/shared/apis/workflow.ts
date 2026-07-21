import type {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
  WorkflowCollectionSpec,
  WorkflowUrlSpec,
} from "./schema-types";

/**
 * Catalog types describing analysis workflows and their parameters.
 */
export interface Workflow {
  assemblyCountMax: number | null;
  assemblyCountMin: number;
  iwcId: string;
  parameters: WorkflowParameter[];
  ploidy: WORKFLOW_PLOIDY;
  scope: WORKFLOW_SCOPE;
  taxonomyId: string | null;
  trsId: string;
  workflowDescription: string;
  workflowId?: string; // Galaxy stored workflow ID for non-TRS workflows
  workflowName: string;
}

export interface WorkflowAssemblyMapping {
  compatibleAssemblyCount: number;
  workflowTrsId: string;
}

export interface WorkflowCategory {
  category: string;
  description: string;
  name: string;
  showComingSoon: boolean;
  workflows: Workflow[];
}

export interface WorkflowDataRequirements {
  description?: string;
  library_layout?: string;
  library_source?: string[];
  library_strategy?: string[];
}

export interface WorkflowParameter {
  collection_spec?: WorkflowCollectionSpec;
  data_requirements?: WorkflowDataRequirements;
  key: string;
  url_spec?: WorkflowUrlSpec;
  variable?: WORKFLOW_PARAMETER_VARIABLE;
}
