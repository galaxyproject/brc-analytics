import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { type WorkflowEntity } from "@repo/shared/views/WorkflowsView/types";
import { formatTrsId } from "@repo/shared/workflow/utils";
import { type GA2AssemblyEntity, type GA2OrganismEntity } from "./types";

/**
 * Get the ID of the given assembly entity.
 * @param entity - Entity.
 * @returns entity ID.
 */
export function getAssemblyId(entity?: GA2AssemblyEntity): string {
  return sanitizeEntityId(entity?.accession);
}

/**
 * Get the title of the given assembly entity.
 * @param entity - Entity.
 * @returns entity title.
 */
export function getAssemblyTitle(entity?: GA2AssemblyEntity): string {
  return entity?.taxonomicLevelSpecies || "";
}

/**
 * Get the ID of the given organism entity.
 * @param entity - Entity.
 * @returns entity ID.
 */
export function getOrganismId(entity?: GA2OrganismEntity): string {
  return entity?.ncbiTaxonomyId || "";
}

/**
 * Get the ID of the workflow entity.
 * @param workflow - Workflow.
 * @returns workflow ID.
 */
export function getWorkflowId(workflow: WorkflowEntity): string {
  return formatTrsId(workflow.trsId);
}
