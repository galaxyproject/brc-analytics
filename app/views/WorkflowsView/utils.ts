import { WorkflowEntity } from "../../../site-config/brc-analytics/local/index/workflow/types";
import { WorkflowCategory } from "../../apis/catalog/brc-analytics-catalog/common/entities";

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Each workflow includes the properties of the workflow itself along with the name of its category.
 * @param workflowCategories - An array of workflow categories, each containing an array of workflows.
 * @returns An array of workflows, where each workflow is a combination of a workflow and its category name.
 */
export function getWorkflows(
  workflowCategories: WorkflowCategory[]
): WorkflowEntity[] {
  const workflows: WorkflowEntity[] = [];

  for (const category of workflowCategories) {
    if (!category.workflows) continue;
    for (const workflow of category.workflows) {
      workflows.push({ ...workflow, category: category.name });
    }
  }

  return workflows;
}
