import {
  WORKFLOW_CATEGORY_ID,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type { AssemblyContract } from "@repo/shared/apis/types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import type { WorkflowGates } from "@repo/shared/workflow/featureFlags";
import {
  workflowPloidyMatchesOrganismPloidy,
  workflowRequiresAssemblyId,
} from "@repo/shared/workflow/utils";

/**
 * Builds workflow categories for the given assembly.
 * Differential Expression Analysis is added to the Transcriptomics category.
 * @param assembly - Assembly.
 * @param allWorkflowCategories - Workflow categories.
 * @param workflowGates - Feature-flag gating rules bound to the user's flag state.
 * @returns Workflow categories compatible with the given assembly.
 */
export function buildAssemblyWorkflows(
  assembly: AssemblyContract,
  allWorkflowCategories: WorkflowCategory[],
  workflowGates: WorkflowGates
): WorkflowCategory[] {
  const workflowCategories: WorkflowCategory[] = [];

  for (const workflowCategory of workflowGates.filterCategories(
    allWorkflowCategories
  )) {
    const { workflows: categoryWorkflows } = workflowCategory;

    // Filter workflows to only include those that are compatible with the given
    // assembly and have ASSEMBLY scope. Every workflow carries a scope by the
    // time it reaches here: the catalog build fills in ASSEMBLY for source
    // entries that omit it, so this match never has an absent scope to handle.
    const compatibleWorkflows = categoryWorkflows.filter(
      (workflow) =>
        workflowIsCompatibleWithAssembly(workflow, assembly) &&
        workflow.scope === WORKFLOW_SCOPE.ASSEMBLY
    );

    if (workflowCategory.category === WORKFLOW_CATEGORY_ID.TRANSCRIPTOMICS) {
      compatibleWorkflows.unshift(DIFFERENTIAL_EXPRESSION_ANALYSIS);
    }

    // If no workflows are compatible with the assembly and the category is not marked as "showComingSoon", skip it.
    if (compatibleWorkflows.length === 0 && !workflowCategory.showComingSoon)
      continue;

    // Add workflow category to workflows array with updated compatible workflows.
    workflowCategories.push({
      ...workflowCategory,
      workflows: compatibleWorkflows,
    });
  }

  // Sort workflow categories (coming soon categories last).
  return workflowCategories.sort(sortWorkflowCategories);
}

/**
 * Sorts workflow categories by whether they have workflows or not.
 * @param a - Workflow category.
 * @param b - Workflow category.
 * @returns 1 if a has workflows and b does not, -1 if b has workflows and a does not, 0 otherwise.
 */
function sortWorkflowCategories(
  a: WorkflowCategory,
  b: WorkflowCategory
): number {
  if (a.workflows.length === 0 && b.workflows.length > 0) return 1;
  if (a.workflows.length > 0 && b.workflows.length === 0) return -1;
  return 0;
}

/**
 * Determines if a workflow is compatible with a given assembly.
 * @param workflow - The workflow to check compatibility for.
 * @param assembly - The assembly to check compatibility against.
 * @returns True if the workflow is compatible with the assembly, false otherwise.
 */
export function workflowIsCompatibleWithAssembly(
  workflow: Workflow,
  assembly: AssemblyContract
): boolean {
  if (
    workflow.taxonomyId !== null &&
    !assembly.lineageTaxonomyIds.includes(workflow.taxonomyId)
  ) {
    return false;
  }
  if (
    !assembly.ploidy.some((assemblyPloidy) =>
      workflowPloidyMatchesOrganismPloidy(workflow.ploidy, assemblyPloidy)
    )
  ) {
    return false;
  }
  // Filter out workflows requiring ASSEMBLY_ID when assembly lacks Galaxy datacache URL.
  // ASSEMBLY_ID workflows need pre-built indexes (Bowtie2, BWA, etc.) accessible via datacache.
  if (workflowRequiresAssemblyId(workflow) && !assembly.galaxyDatacacheUrl) {
    return false;
  }
  return true;
}
