import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  Workflow,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  GA2AssemblyEntity,
  GA2OrganismEntity,
} from "../../apis/catalog/ga2/entities";
import { getEntities, getEntity } from "./query";

/**
 * Gets assemblies.
 * @returns Assemblies.
 */
export function getAssemblies<
  T extends BRCDataCatalogGenome | GA2AssemblyEntity,
>(): T[] {
  return getEntities<T>("assemblies");
}

/**
 * Gets assembly by entity id.
 * @param entityId - Entity id.
 * @returns Assembly.
 */
export function getAssembly<T extends BRCDataCatalogGenome | GA2AssemblyEntity>(
  entityId: string
): T {
  return getEntity<T>("assemblies", entityId);
}

/**
 * Gets organism by entity id.
 * @param entityId - Entity id.
 * @returns Organism.
 */
export function getOrganism<
  T extends BRCDataCatalogOrganism | GA2OrganismEntity,
>(entityId: string): T {
  return getEntity<T>("organisms", entityId);
}

/**
 * Gets organisms.
 * @returns Organisms.
 */
export function getOrganisms<
  T extends BRCDataCatalogOrganism | GA2OrganismEntity,
>(): T[] {
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
