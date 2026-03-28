import { WorkflowCategoryId } from "../../../../../catalog/schema/generated/schema";
import {
  BRCDataCatalogGenome,
  Workflow,
  WorkflowCategory,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_SCOPE,
} from "../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { workflowPloidyMatchesOrganismPloidy } from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import { GA2AssemblyEntity } from "../../../../apis/catalog/ga2/entities";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../differentialExpressionAnalysis/constants";

/**
 * Builds workflow categories for the given assembly.
 * Differential Expression Analysis is added to the Transcriptomics category.
 * @param assembly - Assembly.
 * @param allWorkflowCategories - Workflow categories.
 * @returns Workflow categories compatible with the given assembly.
 */
export function buildAssemblyWorkflows(
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity,
  allWorkflowCategories: WorkflowCategory[]
): WorkflowCategory[] {
  const workflowCategories: WorkflowCategory[] = [];

  for (const workflowCategory of allWorkflowCategories) {
    const { workflows: categoryWorkflows } = workflowCategory;

    // Filter workflows to only include those that are compatible with the given assembly
    // and have ASSEMBLY scope (or no scope specified, which defaults to ASSEMBLY).
    const compatibleWorkflows = categoryWorkflows.filter(
      (workflow) =>
        workflowIsCompatibleWithAssembly(workflow, assembly) &&
        (!workflow.scope || workflow.scope === WORKFLOW_SCOPE.ASSEMBLY)
    );

    if (workflowCategory.category === WorkflowCategoryId.TRANSCRIPTOMICS) {
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
 * Formats a trsId for use in URLs by removing the hash character if it begins with one
 * and replacing any special characters with hyphens.
 * @param trsId - The trsId to format.
 * @returns The formatted trsId.
 */
export function formatTrsId(trsId: string): string {
  return trsId.replace(/^#/, "").replace(/[^a-zA-Z0-9]/g, "-");
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
 * Checks if a workflow requires the ASSEMBLY_ID parameter.
 * Workflows with ASSEMBLY_ID depend on Galaxy having pre-built indexes (dbkey) for the assembly.
 * @param workflow - The workflow to check.
 * @returns True if the workflow has a parameter with ASSEMBLY_ID variable, false otherwise.
 */
export function workflowRequiresAssemblyId(workflow: Workflow): boolean {
  return workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID
  );
}

/**
 * Determines if a workflow is compatible with a given assembly.
 * @param workflow - The workflow to check compatibility for.
 * @param assembly - The assembly to check compatibility against.
 * @returns True if the workflow is compatible with the assembly, false otherwise.
 */
export function workflowIsCompatibleWithAssembly(
  workflow: Workflow,
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity
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
