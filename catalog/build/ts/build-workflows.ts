import {
  Workflow,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  Workflow as SourceWorkflow,
  WorkflowCategories as SourceWorkflowCategories,
  Workflows as SourceWorkflows,
} from "../../schema/generated/schema";
import { readYamlFile } from "./utils";

const SOURCE_PATH_WORKFLOW_CATEGORIES =
  "catalog/source/workflow_categories.yml";
const SOURCE_PATH_WORKFLOWS = "catalog/source/workflows.yml";

export async function buildWorkflows(): Promise<WorkflowCategory[]> {
  const sourceWorkflowCategories = await readYamlFile<SourceWorkflowCategories>(
    SOURCE_PATH_WORKFLOW_CATEGORIES
  );
  const sourceWorkflows = await readYamlFile<SourceWorkflows>(
    SOURCE_PATH_WORKFLOWS
  );

  const workflowCategories: WorkflowCategory[] =
    sourceWorkflowCategories.workflow_categories.map(
      ({ category, description, name, show_coming_soon }) => ({
        category,
        description,
        name,
        showComingSoon: show_coming_soon,
        workflows: [],
      })
    );

  for (const sourceWorkflow of sourceWorkflows.workflows) {
    if (sourceWorkflow.active) {
      buildWorkflow(workflowCategories, sourceWorkflow);
    }
  }

  return workflowCategories;
}

function buildWorkflow(
  workflowCategories: WorkflowCategory[],
  sourceWorkflow: SourceWorkflow
): void {
  const {
    categories,
    iwc_id: iwcId,
    parameters: sourceParameters,
    ploidy,
    taxonomy_id: taxonomyId,
    trs_id: trsId,
    workflow_description: workflowDescription,
    workflow_name: workflowName,
  } = sourceWorkflow;
  const parameters = [];
  for (const { key, url_spec, variable } of sourceParameters) {
    // Add parameter if either variable or url_spec is defined
    if (variable) parameters.push({ key, variable });
    else if (url_spec) parameters.push({ key, url_spec });
  }
  const workflow: Workflow = {
    iwcId,
    parameters,
    ploidy,
    taxonomyId: typeof taxonomyId === "number" ? String(taxonomyId) : null,
    trsId,
    workflowDescription,
    workflowName,
  };
  for (const category of categories) {
    const workflowCategory = workflowCategories.find(
      (c) => c.category === category
    );
    if (!workflowCategory)
      throw new Error(`Unknown workflow category: ${category}`);
    workflowCategory.workflows.push(workflow);
  }
}
