import { ENA_QUERY_METHOD, SEQUENCING_DATA_TYPE } from "../../../../types";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { ReadRun } from "../../types";
import { PRESELECTED_COLUMN_FILTERS } from "./constants";

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
 * Pre-selects column filters based on the given step key for ENA query method by taxonomy ID.
 * @param table - Table instance.
 * @param stepKey - Step key.
 */
export function preSelectColumnFilters(
  table: Table<ReadRun>,
  stepKey: SEQUENCING_DATA_TYPE
): void {
  if (isENAQueryMethodByTaxonomyId(table)) {
    const preselectedFilters = PRESELECTED_COLUMN_FILTERS[stepKey];
    const columnFiltersState = buildValidatedColumnFilters(
      table,
      preselectedFilters
    );
    table.setColumnFilters(columnFiltersState);
  }
}

/**
 * Builds validated column filters from preselected filter values.
 * Filters out columns that don't exist in the table and values that aren't available
 * in the column's faceted unique values.
 * @param table - Table instance.
 * @param preselectedFilters - Record of column IDs to arrays of desired filter values.
 * @returns Column filters state.
 */
function buildValidatedColumnFilters(
  table: Table<ReadRun>,
  preselectedFilters: Record<string, string[]>
): ColumnFiltersState {
  const columnFiltersState: ColumnFiltersState = [];

  for (const [columnId, desiredValues] of Object.entries(preselectedFilters)) {
    const column = table.getColumn(columnId);
    if (!column) continue;

    const availableValues = column.getFacetedUniqueValues();
    const validValues: string[] = [];

    // Only include values that exist in the column's faceted data.
    for (const value of desiredValues) {
      if (!availableValues.has(value)) continue;
      validValues.push(value);
    }

    if (validValues.length === 0) continue;

    columnFiltersState.push({ id: columnId, value: validValues });
  }

  return columnFiltersState;
}
