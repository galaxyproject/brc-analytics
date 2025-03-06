import {
  Workflow,
  WorkflowCategory,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
  workflowCategory: WorkflowCategory;
  workflows: Workflow[];
}
