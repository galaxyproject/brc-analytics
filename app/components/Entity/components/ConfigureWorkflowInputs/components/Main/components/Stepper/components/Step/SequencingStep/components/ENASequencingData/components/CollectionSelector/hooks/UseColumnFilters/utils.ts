import { SEQUENCING_DATA_TYPE } from "../../../../../../types";
import { ColumnFiltersState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "../UseTable/categoryConfigs";
import {
  Workflow,
  WorkflowParameter,
} from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_BY_STEP_KEY } from "../../constants";
import { StepProps } from "../../../../../../../types";
import { isSequencingDataType } from "./typeGuards";

/**
 * Gets library strategy requirements from a workflow parameter.
 * @param parameter - The workflow parameter.
 * @returns Array of library strategy values or null if not specified.
 */
export function getLibraryStrategyRequirements(
  parameter?: WorkflowParameter
): string[] | null {
  if (
    !parameter ||
    !parameter.data_requirements ||
    !parameter.data_requirements.library_strategy
  ) {
    return null;
  }
  return parameter.data_requirements.library_strategy;
}

/**
 * Gets library source requirements from a workflow parameter.
 * @param parameter - The workflow parameter.
 * @returns Array of library source values or null if not specified.
 */
export function getLibrarySourceRequirements(
  parameter?: WorkflowParameter
): string[] | null {
  if (
    !parameter ||
    !parameter.data_requirements ||
    !parameter.data_requirements.library_source
  ) {
    return null;
  }
  return parameter.data_requirements.library_source;
}

/**
 * Gets description from a workflow parameter's data requirements.
 * @param parameter - The workflow parameter.
 * @returns Description string or null if not specified.
 */
export function getDescriptionRequirement(
  parameter?: WorkflowParameter
): string | null {
  if (
    !parameter ||
    !parameter.data_requirements ||
    !parameter.data_requirements.description
  ) {
    return null;
  }
  return parameter.data_requirements.description;
}

/**
 * Returns the workflow parameter for the given step key.
 * @param workflow - Workflow.
 * @param stepKey - Step key.
 * @returns Workflow parameter for the given step key.
 */
export function getWorkflowParameter(
  workflow: Pick<Workflow, "parameters">,
  stepKey:
    | SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    | SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE
): WorkflowParameter | undefined {
  return workflow.parameters.find(
    ({ variable }) => variable === WORKFLOW_PARAMETER_BY_STEP_KEY[stepKey]
  );
}

/**
 * Builds filters based on step key and workflow parameter requirements.
 * @param stepKey - The sequencing data type (paired or single).
 * @param workflowParameter - Optional workflow parameter with data requirements.
 * @returns Filters with layout, strategy, source, and other requirements.
 */
export function buildFilters(
  stepKey:
    | SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    | SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE,
  workflowParameter?: WorkflowParameter
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  // Set library layout based on step key or data requirements
  if (workflowParameter?.data_requirements?.library_layout) {
    // Use the layout from data requirements if specified
    filters[CATEGORY_CONFIGS.LIBRARY_LAYOUT.key] = [
      workflowParameter.data_requirements.library_layout,
    ];
  } else if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED) {
    filters[CATEGORY_CONFIGS.LIBRARY_LAYOUT.key] = ["PAIRED"];
  } else if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE) {
    filters[CATEGORY_CONFIGS.LIBRARY_LAYOUT.key] = ["SINGLE"];
  }

  // Add library strategy requirements if specified in the workflow parameter
  const libraryStrategyRequirements =
    getLibraryStrategyRequirements(workflowParameter);

  if (libraryStrategyRequirements && libraryStrategyRequirements.length > 0) {
    filters[CATEGORY_CONFIGS.LIBRARY_STRATEGY.key] =
      libraryStrategyRequirements;
  } else {
    // Default to WGS if no specific requirements are provided
    filters[CATEGORY_CONFIGS.LIBRARY_STRATEGY.key] = ["WGS"];
  }

  // Add library source requirements if specified
  const librarySourceRequirements =
    getLibrarySourceRequirements(workflowParameter);
  if (librarySourceRequirements && librarySourceRequirements.length > 0) {
    filters[CATEGORY_CONFIGS.LIBRARY_SOURCE.key] = librarySourceRequirements;
  }

  // Handle description field for any library strategy that needs additional context
  const description = getDescriptionRequirement(workflowParameter);
  if (description && CATEGORY_CONFIGS.DESCRIPTION) {
    // Add description filter if available
    filters[CATEGORY_CONFIGS.DESCRIPTION.key] = [description];
  }

  return filters;
}

/**
 * Pre-selects column filters based on the step key and workflow parameters.
 * @param workflow - Workflow.
 * @param stepKey - Step key.
 * @returns Column filters.
 */
export function preSelectColumnFilters(
  workflow: Pick<Workflow, "parameters">,
  stepKey: StepProps["stepKey"]
): ColumnFiltersState {
  // Type guard required; stepKey expected to be SEQUENCING_DATA_TYPE.
  if (!isSequencingDataType(stepKey)) return [];

  // Return empty array for READ_RUNS_ANY as it does not pre-filter its data.
  if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) return [];

  const workflowParameter = getWorkflowParameter(workflow, stepKey);
  const filters = buildFilters(stepKey, workflowParameter);
  return Object.entries(filters).map(([id, value]) => ({ id, value }));
}
