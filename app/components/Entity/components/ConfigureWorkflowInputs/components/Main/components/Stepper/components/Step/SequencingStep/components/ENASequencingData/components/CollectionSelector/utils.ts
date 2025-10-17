import { ENA_QUERY_METHOD, SEQUENCING_DATA_TYPE } from "../../../../types";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { ReadRun } from "../../types";
import { CATEGORY_CONFIGS } from "./hooks/UseTable/categoryConfigs";
import { WorkflowParameter } from "app/apis/catalog/brc-analytics-catalog/common/entities";

/**
 * Builds column filters from preselected values only if they are valid for the current data.
 * A set of preselected filters is considered valid if at least one row in the table satisfies all column filters (AND across columns),
 * where each column filter matches if the row contains at least one of the desired values for that column (OR within a column).
 * If no rows satisfy the filters, an empty list is returned.
 *
 * Note: This does not mutate or filter out individual values; it validates the combination overall.
 *
 * @param table - Table instance.
 * @param preselectedFilters - Record of column IDs to arrays of desired filter values.
 * @returns Column filters state.
 */
function buildValidatedColumnFilters(
  table: Table<ReadRun>,
  preselectedFilters: Record<string, string[]>
): ColumnFiltersState {
  const { rows } = table.getRowModel();

  // We need to ensure that the combined column filters are valid for the given data.
  // A row must have at least one of the desired values (OR-join) for each column filter (AND-join).
  for (const row of rows) {
    let isRowValid = true;

    for (const [id, value] of Object.entries(preselectedFilters)) {
      // Determine the filter set (we can safely assert the value as string array).
      const filterValueSet = new Set(value as string[]);

      // Determine the column values.
      const columnValues = toStringArray(row.getValue(id));

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
    // combination for the table data. There is no need to continue checking the rest of the rows.
    return Object.entries(preselectedFilters).map(([id, value]) => ({
      id,
      value,
    }));
  }

  // No valid rows found, return empty column filters.
  return [];
}

/**
 * Returns true if the table is using data from ENA query method by taxonomy ID.
 * @param table - The table.
 * @returns True if the table is using data from ENA query method by taxonomy ID.
 */
function isENAQueryMethodByTaxonomyId(table: Table<ReadRun>): boolean {
  if (!table.options.meta) return false;
  if (!("enaQueryMethod" in table.options.meta)) return false;

  return table.options.meta.enaQueryMethod === ENA_QUERY_METHOD.TAXONOMY_ID;
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
 * Builds filters based on step key and workflow parameter requirements.
 * @param stepKey - The sequencing data type (paired or single).
 * @param workflowParameter - Optional workflow parameter with data requirements.
 * @returns Filters with layout, strategy, source, and other requirements.
 */
export function buildFilters(
  stepKey: SEQUENCING_DATA_TYPE,
  workflowParameter?: WorkflowParameter
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  // if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) {
  // Do not apply any filters for step key READ_RUNS_ANY.
  // return filters;
  // }

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
 * @param table - Table instance.
 * @param stepKey - Step key.
 * @param workflowParameter - Optional workflow parameter with data requirements.
 */
export function preSelectColumnFilters(
  table: Table<ReadRun>,
  stepKey: SEQUENCING_DATA_TYPE,
  workflowParameter?: WorkflowParameter
): void {
  // Do not apply any filters for step key READ_RUNS_ANY.
  if (stepKey === SEQUENCING_DATA_TYPE.READ_RUNS_ANY) return;
  if (isENAQueryMethodByTaxonomyId(table)) {
    const filters = buildFilters(stepKey, workflowParameter);
    const columnFiltersState = buildValidatedColumnFilters(table, filters);
    table.setColumnFilters(columnFiltersState);
  }
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
