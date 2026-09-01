import type { WorkflowCategory } from "@repo/shared/apis/workflow";

/**
 * A record carrying the workflow categories computed for it at build time.
 */
export type WithWorkflowCategories<T> = T & {
  workflowCategories: WorkflowCategory[];
};
