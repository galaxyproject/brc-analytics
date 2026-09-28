import {
  findAssembly,
  findOrganism,
  findWorkflow,
  findWorkflows,
} from "@repo/shared/services/workflows/entities";
import { isWorkflowListedForAssembly } from "@repo/shared/workflow/assemblyWorkflows";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { isWorkflowListedForOrganism } from "@repo/shared/workflow/organismWorkflows";

/**
 * Determines whether the TRS ID from a URL names a workflow the assembly's
 * configure page may open: one the assembly's analyze page lists. Anything
 * not loaded (the workflow, the assembly or the workflow categories) reads as
 * unavailable, so the page shows its fallback rather than failing.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param entityId - Assembly entity ID.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @returns True when the workflow is available.
 */
export function isAssemblyWorkflowAvailable(
  trsId: string,
  entityId: string,
  workflowGates: WorkflowGates
): boolean {
  const workflow = findWorkflow(trsId);
  const assembly = findAssembly(entityId);
  const workflowCategories = findWorkflows();
  if (!workflow || !assembly || !workflowCategories) return false;
  return isWorkflowListedForAssembly(
    workflow,
    assembly,
    workflowCategories,
    workflowGates
  );
}

/**
 * Determines whether the TRS ID from a URL names a workflow the organism's
 * configure page may open: one the organism's page lists. Anything not loaded
 * (the workflow, the organism or the workflow categories) reads as
 * unavailable, so the page shows its fallback rather than failing.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param entityId - Organism entity ID.
 * @param workflowGates - Gating rules bound to the current flag state.
 * @returns True when the workflow is available.
 */
export function isOrganismWorkflowAvailable(
  trsId: string,
  entityId: string,
  workflowGates: WorkflowGates
): boolean {
  const workflow = findWorkflow(trsId);
  const organism = findOrganism(entityId);
  const workflowCategories = findWorkflows();
  if (!workflow || !organism || !workflowCategories) return false;
  return isWorkflowListedForOrganism(
    workflow,
    organism,
    workflowCategories,
    workflowGates
  );
}
