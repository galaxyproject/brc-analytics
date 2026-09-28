import { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { categoriesIncludeWorkflow } from "@repo/shared/workflow/utils";

/**
 * Builds workflow categories for the given organism.
 * Filters workflows to include only ORGANISM-scoped workflows compatible with the organism's taxonomy.
 * Feature-flag gating is not applied here — flags are per-user runtime state,
 * so callers gate the result where the flags are known, via the bound rules
 * from `useWorkflowGates`.
 * @param organism - Organism.
 * @param allWorkflowCategories - Workflow categories.
 * @returns Workflow categories compatible with the given organism.
 */
export function buildOrganismWorkflows(
  organism: OrganismContract,
  allWorkflowCategories: WorkflowCategory[]
): WorkflowCategory[] {
  const workflowCategories: WorkflowCategory[] = [];

  for (const workflowCategory of allWorkflowCategories) {
    const { workflows: categoryWorkflows } = workflowCategory;

    const compatibleWorkflows = categoryWorkflows.filter(
      (workflow) =>
        workflow.scope === WORKFLOW_SCOPE.ORGANISM &&
        workflowIsCompatibleWithOrganism(workflow, organism)
    );

    if (compatibleWorkflows.length === 0) continue;

    workflowCategories.push({
      ...workflowCategory,
      workflows: compatibleWorkflows,
    });
  }

  return workflowCategories;
}

/**
 * Determines whether a workflow is one the organism's page lists — the check
 * its configure page applies to a workflow named in the URL, so the two pages
 * cannot disagree on scope, entity fit or gating. Gates the same way the
 * organism page does: after the compatible categories are built.
 * @param workflow - Workflow.
 * @param organism - Organism.
 * @param allWorkflowCategories - Workflow categories.
 * @param workflowGates - Feature-flag gating rules bound to the user's flag state.
 * @returns True when the organism's workflow list includes the workflow.
 */
export function isWorkflowListedForOrganism(
  workflow: Workflow,
  organism: OrganismContract,
  allWorkflowCategories: WorkflowCategory[],
  workflowGates: WorkflowGates
): boolean {
  return categoriesIncludeWorkflow(
    workflowGates.filterCategories(
      buildOrganismWorkflows(organism, allWorkflowCategories)
    ),
    workflow
  );
}

/**
 * Determines if a workflow is compatible with a given organism.
 * Checks if the workflow's taxonomy ID is present in any of the organism's genome lineages.
 * @param workflow - The workflow to check compatibility for.
 * @param organism - The organism to check compatibility against.
 * @returns True if the workflow is compatible with the organism, false otherwise.
 */
function workflowIsCompatibleWithOrganism(
  workflow: Workflow,
  organism: OrganismContract
): boolean {
  if (workflow.taxonomyId === null) return true;
  return (organism.genomes ?? []).some((genome) =>
    genome.lineageTaxonomyIds.includes(workflow.taxonomyId as string)
  );
}
