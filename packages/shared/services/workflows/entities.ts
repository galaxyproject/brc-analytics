import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import type { GatedWorkflow } from "@repo/shared/workflow/gates";
import { findEntity, getEntities, getEntity } from "./query";

/**
 * Finds an organism by entity id, returning undefined when there is no match.
 * @param entityId - Entity id.
 * @returns Organism, or undefined when not found.
 */
export function findOrganism<T extends OrganismContract>(
  entityId: string
): T | undefined {
  return findEntity<T>("organisms", entityId);
}

/**
 * Finds a workflow by TRS id, returning undefined when there is no match.
 * @param trsId - TRS id.
 * @returns Workflow, or undefined when not found.
 */
export function findWorkflow(trsId: string): Workflow | undefined {
  return findEntity<Workflow>("workflows", trsId);
}

/**
 * Gets assemblies.
 * @returns Assemblies.
 */
export function getAssemblies<T extends AssemblyContract>(): T[] {
  return getEntities<T>("assemblies");
}

/**
 * Gets assembly by entity id.
 * @param entityId - Entity id.
 * @returns Assembly.
 */
export function getAssembly<T extends AssemblyContract>(entityId: string): T {
  return getEntity<T>("assemblies", entityId);
}

/**
 * Gets a workflow as the gating rules see it: its raw catalog TRS ID — the
 * rules match on that, not the URL form — and the IDs of every catalog category
 * holding it, none for a workflow outside the catalog. Requires the workflows
 * cache to be loaded.
 * @param workflow - Workflow, as looked up by its URL TRS ID.
 * @returns The gated workflow.
 */
export function getGatedWorkflow(workflow: Workflow): GatedWorkflow {
  return {
    categoryIds: getWorkflowCategories(workflow.trsId).map(
      ({ category }) => category
    ),
    trsId: workflow.trsId,
  };
}

/**
 * Gets organism by entity id.
 * @param entityId - Entity id.
 * @returns Organism.
 */
export function getOrganism<T extends OrganismContract>(entityId: string): T {
  return getEntity<T>("organisms", entityId);
}

/**
 * Gets organisms.
 * @returns Organisms.
 */
export function getOrganisms<T extends OrganismContract>(): T[] {
  return getEntities<T>("organisms");
}

/**
 * Gets workflow by TRS id.
 * @param trsId - TRS id.
 * @returns Workflow.
 */
export function getWorkflow(trsId: string): Workflow {
  return getEntity<Workflow>("workflows", trsId);
}

/**
 * Gets every catalog category holding the workflow with the given raw TRS id
 * — a workflow can be listed under more than one. Empty for a workflow no
 * category holds, including one that exists outside the catalog. Throws when
 * no workflows are loaded, so a missing cache fails closed rather than reading
 * as "in no category".
 * @param trsId - Raw TRS id, as the catalog records it.
 * @returns Workflow categories holding the workflow.
 */
export function getWorkflowCategories(trsId: string): WorkflowCategory[] {
  return getWorkflows().filter((category) =>
    category.workflows.some((workflow) => workflow.trsId === trsId)
  );
}

/**
 * Gets workflows.
 * @returns Workflows.
 */
export function getWorkflows(): WorkflowCategory[] {
  return getEntities<WorkflowCategory>("workflows");
}
