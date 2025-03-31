import {
  Workflow,
  WorkflowCategory,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  entityId: string;
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
  isFeatureEnabled: boolean;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
