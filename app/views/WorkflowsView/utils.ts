import type { WorkflowEntity } from "../../../site-config/brc-analytics/local/index/workflow/types";
import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Filters out workflows that have no compatible assemblies for the current site.
 * Each workflow includes the properties of the workflow itself along with the name of its category.
 * @param workflowCategories - An array of workflow categories, each containing an array of workflows.
 * @param mappings - Workflow-assembly mappings for the current site.
 * @returns An array of workflows, where each workflow is a combination of a workflow and its category name.
 */
export function getWorkflows(
  workflowCategories: WorkflowCategory[],
  mappings: WorkflowAssemblyMapping[]
): WorkflowEntity[] {
  const workflows: WorkflowEntity[] = [];

  // Create a lookup map for workflows with compatible assemblies
  const workflowsWithAssemblies = new Set(
    mappings
      .filter((m) => m.compatibleAssemblyCount > 0)
      .map((m) => m.workflowTrsId)
  );

  for (const category of workflowCategories) {
    if (!category.workflows) continue;
    for (const workflow of category.workflows) {
      // Skip workflows with no compatible assemblies
      if (!workflowsWithAssemblies.has(workflow.trsId)) {
        continue;
      }

      workflows.push({
        ...workflow,
        category: category.name,
        disabled: category.showComingSoon === false,
        taxonomyId: workflow.taxonomyId ?? "Unspecified",
      });
    }
  }

  return workflows;
}
