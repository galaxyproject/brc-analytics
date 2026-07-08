import {
  Workflow,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import type {
  AssemblyContract,
  OrganismContract,
} from "../../apis/catalog/common/entities";
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
 * Gets workflows.
 * @returns Workflows.
 */
export function getWorkflows(): WorkflowCategory[] {
  return getEntities<WorkflowCategory>("workflows");
}
