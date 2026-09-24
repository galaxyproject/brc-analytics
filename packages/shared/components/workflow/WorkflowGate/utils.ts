import type { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import {
  findWorkflow,
  getGatedWorkflow,
} from "@repo/shared/services/workflows/entities";
import type { WorkflowGates } from "@repo/shared/workflow/gates";

/**
 * Determines whether the TRS ID from a URL names a workflow the page may show:
 * one that exists, has a scope the page accepts, and passes the gating rules.
 * Requires the workflows cache to be loaded.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param scopes - Workflow scopes the page accepts.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @returns True when the workflow is available.
 */
export function isWorkflowAvailable(
  trsId: string,
  scopes: readonly WORKFLOW_SCOPE[],
  workflowGates: WorkflowGates
): boolean {
  const workflow = findWorkflow(trsId);
  if (!workflow || !scopes.includes(workflow.scope)) return false;
  return workflowGates.isWorkflowAllowed(getGatedWorkflow(workflow));
}
