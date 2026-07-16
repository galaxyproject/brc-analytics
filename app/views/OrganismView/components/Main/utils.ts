import type {
  Workflow,
  WorkflowCategory,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_SCOPE } from "@/apis/catalog/brc-analytics-catalog/common/schema-entities";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";
import { WorkflowCategoryId } from "../../../../../catalog/schema/generated/schema";

/**
 * Builds workflow categories for the given organism.
 * Filters workflows to include only ORGANISM-scoped workflows compatible with the organism's taxonomy.
 * @param organism - Organism.
 * @param allWorkflowCategories - Workflow categories.
 * @param isAssemblyWorkflowsEnabled - Whether the 'assembly-workflows' feature flag is enabled.
 * @returns Workflow categories compatible with the given organism.
 */
export function buildOrganismWorkflows(
  organism: Organism,
  allWorkflowCategories: WorkflowCategory[],
  isAssemblyWorkflowsEnabled = false
): WorkflowCategory[] {
  const workflowCategories: WorkflowCategory[] = [];

  for (const workflowCategory of allWorkflowCategories) {
    if (
      workflowCategory.category === WorkflowCategoryId.ASSEMBLY &&
      !isAssemblyWorkflowsEnabled
    )
      continue;

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
  organism: Organism
): boolean {
  if (workflow.taxonomyId === null) return true;
  return (organism.genomes ?? []).some((genome) =>
    genome.lineageTaxonomyIds.includes(workflow.taxonomyId as string)
  );
}
