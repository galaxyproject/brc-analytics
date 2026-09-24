import type { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import {
  findWorkflow,
  getGatedWorkflow,
} from "@repo/shared/services/workflows/entities";
import type { WorkflowGates } from "@repo/shared/workflow/gates";

/**
 * Determines whether the TRS ID from a URL names a workflow the page may show:
 * one that exists, has the page's scope, and passes the gating rules. Requires
 * the workflows cache to be loaded.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param scope - Scope of the workflows the page configures.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @returns True when the workflow is available.
 */
export function isWorkflowAvailable(
  trsId: string,
  scope: WORKFLOW_SCOPE,
  workflowGates: WorkflowGates
): boolean {
  const workflow = findWorkflow(trsId);
  if (!workflow || workflow.scope !== scope) return false;
  return workflowGates.isWorkflowAllowed(getGatedWorkflow(workflow));
}
