import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";
import {
  findWorkflow,
  findWorkflowCategories,
} from "@repo/shared/services/workflows/entities";
import { isWorkflowListedForAssembly } from "@repo/shared/workflow/assemblyWorkflows";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { isWorkflowListed } from "@repo/shared/workflow/listedWorkflows";
import { isWorkflowListedForOrganism } from "@repo/shared/workflow/organismWorkflows";
import type { EntityWorkflowListing, WorkflowAvailability } from "./types";

/**
 * Binds an entity to the availability check for its configure page: a TRS ID
 * from the URL is available when it names a workflow the entity's listing
 * offers. Anything not loaded (the workflow or the workflow categories) reads
 * as unavailable, so the page shows its fallback rather than failing.
 * @param entity - Entity the page configures a workflow for.
 * @param isWorkflowListedForEntity - Whether the entity's listing offers a workflow.
 * @returns Availability check for the entity's configure page.
 */
function bindEntityWorkflowAvailability<T>(
  entity: T,
  isWorkflowListedForEntity: EntityWorkflowListing<T>
): WorkflowAvailability {
  return (trsId, workflowGates) => {
    const workflow = findWorkflow(trsId);
    const workflowCategories = findWorkflowCategories();
    if (!workflow || !workflowCategories) return false;
    return isWorkflowListedForEntity(
      workflow,
      entity,
      workflowCategories,
      workflowGates
    );
  };
}

/**
 * Builds the availability check for an assembly's configure page, which may
 * open the workflows the assembly's analyze page lists.
 * @param assembly - Assembly.
 * @returns Availability check for the assembly's configure page.
 */
export function getAssemblyWorkflowAvailability(
  assembly: AssemblyContract
): WorkflowAvailability {
  return bindEntityWorkflowAvailability(assembly, isWorkflowListedForAssembly);
}

/**
 * Builds the availability check for an organism's configure page, which may
 * open the workflows the organism's page lists.
 * @param organism - Organism.
 * @returns Availability check for the organism's configure page.
 */
export function getOrganismWorkflowAvailability(
  organism: OrganismContract
): WorkflowAvailability {
  return bindEntityWorkflowAvailability(organism, isWorkflowListedForOrganism);
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
