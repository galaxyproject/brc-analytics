import { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  findOrganism,
  getOrganisms,
} from "@repo/shared/services/workflows/entities";
import { workflowIsCompatibleWithOrganism } from "@repo/shared/workflow/organismWorkflows";

/**
 * Finds the catalog organism an organism-scoped workflow's taxonomyId resolves
 * to directly, i.e. when the taxonomyId is itself a catalog organism.
 * @param workflow - Workflow being configured.
 * @returns The organism, or undefined for assembly-scoped / no-taxonomyId
 * workflows, or when the taxonomyId is a clade with no catalog organism.
 */
export function findWorkflowTaxonOrganism(
  workflow: Workflow
): OrganismContract | undefined {
  if (!isOrganismScopedWithTaxon(workflow)) return;
  return findOrganism<OrganismContract>(
    sanitizeEntityId(workflow.taxonomyId ?? undefined)
  );
}

/**
 * Lists the catalog organisms within an organism-scoped workflow's clade — a
 * taxonomyId above species that is not itself a catalog organism. An organism
 * is within the clade when any of its genomes' lineages contains the workflow's
 * taxon, the same rule an organism's page uses to list the workflow.
 * @param workflow - Workflow being configured.
 * @returns Organisms within the clade, or an empty array when the workflow's
 * taxonomyId is not a clade.
 */
export function getCladeOrganisms(workflow: Workflow): OrganismContract[] {
  if (!isCladeWorkflow(workflow)) return [];
  return getOrganisms().filter((organism) =>
    workflowIsCompatibleWithOrganism(workflow, organism)
  );
}

/**
 * Determines whether an organism-scoped workflow's clade has any catalog
 * organism to pick.
 * @param workflow - Workflow being configured.
 * @returns True when the workflow's taxonomyId is a clade with at least one
 * catalog organism.
 */
export function hasCladeOrganisms(workflow: Workflow): boolean {
  return getCladeOrganisms(workflow).length > 0;
}

/**
 * Determines whether an organism-scoped workflow's taxonomyId is a clade, i.e.
 * it does not resolve to a catalog organism.
 * @param workflow - Workflow being configured.
 * @returns True when the workflow is organism-scoped with a taxonomyId that is
 * not a catalog organism.
 */
function isCladeWorkflow(workflow: Workflow): boolean {
  return (
    isOrganismScopedWithTaxon(workflow) && !findWorkflowTaxonOrganism(workflow)
  );
}

/**
 * Determines whether a workflow is organism-scoped and declares a taxonomyId.
 * @param workflow - Workflow.
 * @returns True when the workflow is organism-scoped with a taxonomyId.
 */
function isOrganismScopedWithTaxon(workflow: Workflow): boolean {
  return workflow.scope === WORKFLOW_SCOPE.ORGANISM && !!workflow.taxonomyId;
}
