import { SEQUENCING_DATA_TYPE } from "../../../../types";
import { ColumnFiltersState } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./hooks/UseTable/categoryConfigs";
import {
  Workflow,
  WorkflowParameter,
} from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_BY_STEP_KEY } from "./constants";

/**
 * Builds column filters from preselected values only if they are valid for the current data.
 * A set of preselected filters is considered valid if at least one row of data satisfies all column filters (AND across columns),
 * where each column filter matches if the row contains at least one of the desired values for that column (OR within a column).
 * If no rows satisfy the filters, an empty list is returned.
 *
 * Note: This does not mutate or filter out individual values; it validates the combination overall.
 *
 * @param rows - Rows (read runs).
 * @param preselectedFilters - Record of column IDs to arrays of desired filter values.
 * @returns Column filters state.
 */
function buildValidatedColumnFilters<T>(
  rows: T[],
  preselectedFilters: Record<string, string[]>
): ColumnFiltersState {
  // We need to ensure that the combined column filters are valid for the given data.
  // A row must have at least one of the desired values (OR-join) for each column filter (AND-join).
  for (const row of rows) {
    let isRowValid = true;

    for (const [id, value] of Object.entries(preselectedFilters)) {
      // Determine the filter set (we can safely assert the value as string array).
      const filterValueSet = new Set(value as string[]);

      // Determine the column values.
      const columnValues = toStringArray(row[id as keyof T]);

      // At least one of the desired values must be present in the column "OR".
      let hasAny = false;
      for (const v of columnValues) {
        if (filterValueSet.has(v)) {
          hasAny = true;
          break;
        }
      }

      // If the row is not valid, break (no need to check the rest of the columns).
      if (!hasAny) {
        isRowValid = false;
        break;
      }
    }

    // If the row is not valid, continue to the next row.
    if (!isRowValid) continue;

    // Found a valid row i.e. we know the pre-selected column filters will be a valid
    // combination for the data. There is no need to continue checking the rest of the rows.
    return Object.entries(preselectedFilters).map(([id, value]) => ({
      id,
      value,
    }));
  }

  // No valid rows found, return empty column filters.
  return [];
}

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
  workflow: Workflow,
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
 * Pre-selects column filters based on the given step key for ENA query method by taxonomy ID.
 * @param workflow - Workflow.
 * @param rows - Rows (read runs).
 * @param stepKey - Step key.
 * @returns Column filters for the given ENA data.
 */
export function preSelectColumnFilters<T>(
  workflow: Workflow,
  rows: T[],
  stepKey:
    | SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED
    | SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE
): ColumnFiltersState {
  const workflowParameter = getWorkflowParameter(workflow, stepKey);
  const filters = buildFilters(stepKey, workflowParameter);
  return buildValidatedColumnFilters(rows, filters);
}

/**
 * Converts a value to an array of strings.
 * @param value - The value to convert.
 * @returns An array of strings.
 */
function toStringArray(value: unknown): string[] {
  if (value === null) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}
