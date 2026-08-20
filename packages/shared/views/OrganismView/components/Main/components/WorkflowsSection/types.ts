import { type WorkflowCategory } from "@repo/shared/apis/workflow";

export interface Props {
  entityId: string;
  workflowCategories: WorkflowCategory[];
}
