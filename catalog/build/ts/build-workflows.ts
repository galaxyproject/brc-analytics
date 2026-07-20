import type {
  Workflow,
  WorkflowCategory,
  WorkflowParameter,
} from "../../../packages/core/apis/workflow";
import {
  Workflow as SourceWorkflow,
  WorkflowCategories as SourceWorkflowCategories,
  Workflows as SourceWorkflows,
  WorkflowParameterVariable,
  WorkflowScope,
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

/**
 * Validates that a URL is well-formed and can produce a valid identifier.
 * Throws an error if validation fails.
 * @param url - The URL to validate.
 * @param context - Context string for error messages (e.g., workflow and parameter name).
 */
function validateUrl(url: string, context: string): void {
  if (!url) {
    throw new Error(`${context}: URL is empty or undefined`);
  }

  // Parse URL to validate structure
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error(
      `${context}: Invalid URL "${url}" - ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Ensure URL has valid protocol (http or https only)
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `${context}: URL "${url}" must use http or https protocol, got "${parsedUrl.protocol}"`
    );
  }

  // Ensure URL has hostname
  if (!parsedUrl.hostname) {
    throw new Error(`${context}: URL "${url}" is missing hostname`);
  }

  // Extract filename from URL path
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const filename = pathParts[pathParts.length - 1];

  if (!filename || filename.trim() === "") {
    throw new Error(
      `${context}: Cannot extract filename from URL "${url}". ` +
        `URL path must end with a filename (e.g., /path/to/file.ext), not a directory or trailing slash.`
    );
  }
}

/* eslint-disable-next-line sonarjs/cognitive-complexity -- function handles multiple optional fields */
function buildWorkflow(
  workflowCategories: WorkflowCategory[],
  sourceWorkflow: SourceWorkflow
): void {
  const {
    assembly_count_max: assemblyCountMax,
    assembly_count_min: assemblyCountMin,
    categories,
    iwc_id: iwcId,
    parameters: sourceParameters,
    ploidy,
    scope,
    taxonomy_id: taxonomyId,
    trs_id: trsId,
    workflow_description: workflowDescription,
    workflow_name: workflowName,
  } = sourceWorkflow;
  const parameters = [];
  for (const {
    collection_spec,
    data_requirements,
    key,
    url_spec,
    variable,
  } of sourceParameters) {
    // Validate that only one parameter source is defined
    const definedSources = [
      variable ? "variable" : null,
      url_spec ? "url_spec" : null,
      collection_spec ? "collection_spec" : null,
    ].filter(Boolean);

    if (definedSources.length > 1) {
      throw new Error(
        `Workflow "${workflowName}", parameter "${key}": Only one of variable, url_spec, or collection_spec can be defined. Found: ${definedSources.join(", ")}`
      );
    }

    // Create parameter object with all available properties
    const parameter: WorkflowParameter = { key };

    // Add variable if defined
    if (variable) parameter.variable = variable;

    // Add url_spec if defined and validate URL
    if (url_spec) {
      validateUrl(
        url_spec.url,
        `Workflow "${workflowName}", parameter "${key}"`
      );
      parameter.url_spec = url_spec;
    }

    // Add collection_spec if defined and validate all URLs
    if (collection_spec) {
      if (!collection_spec.elements || collection_spec.elements.length === 0) {
        throw new Error(
          `Workflow "${workflowName}", parameter "${key}": collection_spec must have at least one element`
        );
      }

      collection_spec.elements.forEach((element, index) => {
        validateUrl(
          element.url,
          `Workflow "${workflowName}", parameter "${key}", collection element ${index}`
        );
      });

      parameter.collection_spec = collection_spec;
    }

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

    // Add parameter if it has variable, url_spec, or collection_spec
    if (variable || url_spec || collection_spec) parameters.push(parameter);
  }

  // Validate paired-file variable consistency: both forward and reverse must be present together
  const variables = parameters.map((p) => p.variable).filter((v) => !!v);
  const hasForward = variables.includes(
    WorkflowParameterVariable.SANGER_READ_RUN_FORWARD_FILE
  );
  const hasReverse = variables.includes(
    WorkflowParameterVariable.SANGER_READ_RUN_REVERSE_FILE
  );
  if (hasForward !== hasReverse) {
    console.warn(
      `Workflow "${workflowName}" skipped: SANGER_READ_RUN_FORWARD_FILE and SANGER_READ_RUN_REVERSE_FILE must both be present or both absent.`
    );
    return;
  }

  const resolvedScope = scope ?? WorkflowScope.ASSEMBLY;

  // Resolve assembly count defaults based on scope.
  // ASSEMBLY scope: default 1/1 (single assembly selection).
  // ORGANISM and SEQUENCE: must be declared explicitly.
  let resolvedMin: number;
  let resolvedMax: number | null;
  if (resolvedScope === WorkflowScope.ASSEMBLY) {
    resolvedMin = assemblyCountMin ?? 1;
    resolvedMax = assemblyCountMax ?? 1;
  } else {
    if (assemblyCountMin === null || assemblyCountMin === undefined) {
      throw new Error(
        `Workflow "${workflowName}" (scope: ${resolvedScope}): assembly_count_min is required for ORGANISM and SEQUENCE scope workflows`
      );
    }
    resolvedMin = assemblyCountMin;
    resolvedMax = assemblyCountMax ?? null;
  }

  const workflow: Workflow = {
    assemblyCountMax: resolvedMax,
    assemblyCountMin: resolvedMin,
    iwcId,
    parameters,
    ploidy,
    scope: resolvedScope,
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
