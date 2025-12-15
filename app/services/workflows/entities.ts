import {
  BRCDataCatalogGenome,
  Workflow,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { getEntities, getEntity } from "./query";
import { GA2AssemblyEntity } from "../../apis/catalog/ga2/entities";

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
