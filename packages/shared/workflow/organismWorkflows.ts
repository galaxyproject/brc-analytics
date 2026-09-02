import { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";

/**
 * Builds workflow categories for the given organism.
 * Filters workflows to include only ORGANISM-scoped workflows compatible with the organism's taxonomy.
 * Feature-flag gating is not applied here — flags are per-user runtime state,
 * so callers apply `filterFlagGatedWorkflowCategories` where the flags are known.
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
