import {
  findAssembly,
  findOrganism,
  findWorkflow,
  findWorkflowCategories,
} from "@repo/shared/services/workflows/entities";
import { isWorkflowListedForAssembly } from "@repo/shared/workflow/assemblyWorkflows";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { isWorkflowListed } from "@repo/shared/workflow/listedWorkflows";
import { isWorkflowListedForOrganism } from "@repo/shared/workflow/organismWorkflows";

/**
 * Determines whether the TRS ID from a URL names a workflow the assembly's
 * configure page may open: one the assembly's analyze page lists. Anything
 * not loaded (the workflow, the assembly or the workflow categories) reads as
 * unavailable, so the page shows its fallback rather than failing.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @param entityId - Assembly entity ID.
 * @returns True when the workflow is available.
 */
export function isAssemblyWorkflowAvailable(
  trsId: string,
  workflowGates: WorkflowGates,
  entityId: string
): boolean {
  const workflow = findWorkflow(trsId);
  const assembly = findAssembly(entityId);
  const workflowCategories = findWorkflowCategories();
  if (!workflow || !assembly || !workflowCategories) return false;
  return isWorkflowListedForAssembly(
    workflow,
    assembly,
    workflowCategories,
    workflowGates
  );
}

/**
 * Determines whether the TRS ID from a URL names a workflow the workflow detail
 * page may open: one the workflows listing offers under the current gates,
 * whether from the catalog or appended to it. Anything not loaded (the workflow
 * or the workflow categories) reads as unavailable, so the page shows its
 * fallback rather than failing.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @returns True when the workflow is available.
 */
export function isListedWorkflowAvailable(
  trsId: string,
  workflowGates: WorkflowGates
): boolean {
  const workflow = findWorkflow(trsId);
  const workflowCategories = findWorkflowCategories();
  if (!workflow || !workflowCategories) return false;
  return isWorkflowListed(workflow, workflowCategories, workflowGates);
}

/**
 * Determines whether the TRS ID from a URL names a workflow the organism's
 * configure page may open: one the organism's page lists. Anything not loaded
 * (the workflow, the organism or the workflow categories) reads as
 * unavailable, so the page shows its fallback rather than failing.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @param entityId - Organism entity ID.
 * @returns True when the workflow is available.
 */
export function isOrganismWorkflowAvailable(
  trsId: string,
  workflowGates: WorkflowGates,
  entityId: string
): boolean {
  const workflow = findWorkflow(trsId);
  const organism = findOrganism(entityId);
  const workflowCategories = findWorkflowCategories();
  if (!workflow || !organism || !workflowCategories) return false;
  return isWorkflowListedForOrganism(
    workflow,
    organism,
    workflowCategories,
    workflowGates
  );
}
