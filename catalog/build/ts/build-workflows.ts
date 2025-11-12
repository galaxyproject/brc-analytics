import {
  Workflow,
  WorkflowCategory,
  WorkflowParameter,
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
  for (const {
    data_requirements,
    key,
    url_spec,
    variable,
  } of sourceParameters) {
    // Create parameter object with all available properties
    const parameter: WorkflowParameter = { key };

    // Add variable if defined
    if (variable) parameter.variable = variable;

    // Add url_spec if defined
    if (url_spec) parameter.url_spec = url_spec;

    // Add data_requirements if defined
    if (data_requirements) {
      // Convert any null values to undefined to match the expected type
      const sanitizedDataRequirements: WorkflowParameter["data_requirements"] =
        {
          description: data_requirements.description || undefined,
          library_layout: data_requirements.library_layout || undefined,
          library_source: data_requirements.library_source || undefined,
          library_strategy: data_requirements.library_strategy || undefined,
        };
      parameter.data_requirements = sanitizedDataRequirements;
    }

    // Add parameter if it has either variable or url_spec
    if (variable || url_spec) parameters.push(parameter);
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
