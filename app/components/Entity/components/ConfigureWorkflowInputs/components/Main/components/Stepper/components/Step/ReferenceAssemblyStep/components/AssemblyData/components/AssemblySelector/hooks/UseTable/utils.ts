import { ColumnFiltersState, Row, Table } from "@tanstack/react-table";
import { Workflow } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PLOIDY } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { Assembly } from "./types";

/**
 * Checks if the row is selectable.
 * @param row - Row to check.
 * @returns True if the row is selectable, false otherwise.
 */
export function enableRowSelection(row: Row<Assembly>): boolean {
  return row.original.validation.isValid;
}

/** Returns the initial column filters for the table based on the workflow's ploidy.
 * If the workflow's ploidy is not "ANY", it pre-selects the ploidy filter with the workflow's ploidy value.
 * If the workflow has a taxonomy requirement, it pre-selects the taxonomy filter with the workflow's taxonomy ID.
 * @param workflow - Workflow to get the ploidy from.
 * @returns The initial column filters for the table.
 */
export function getInitialColumnFilters(
  workflow: Workflow
): ColumnFiltersState {
  const columnFilterState = [];

  // If the workflow has a specific ploidy requirement, pre-select that ploidy in the filters.
  if (workflow.ploidy !== WORKFLOW_PLOIDY.ANY) {
    columnFilterState.push({
      id: CATEGORY_CONFIGS.PLOIDY.key,
      value: [workflow.ploidy],
    });
  }

  // If the workflow has a specific taxonomy requirement, pre-select that taxonomy in the filters.
  if (workflow.taxonomyId) {
    columnFilterState.push({
      id: CATEGORY_CONFIGS.TAXONOMY_ID.key,
      value: [workflow.taxonomyId],
    });
  }

  return columnFilterState;
}

/**
 * Returns the row selection validation message for a row.
 * @param row - Row.
 * @returns The row selection validation message for the row.
 */
export function getRowSelectionValidation(
  row: Row<Assembly>
): string | undefined {
  return row.original.validation.error;
}

/** Renders the summary row counts for the table.
 * @param table - Table instance.
 * @returns The summary row counts for the table.
 */
export function renderSummary(table: Table<Assembly>): string {
  const { getPreFilteredRowModel, getRowCount } = table;
  const { rows } = getPreFilteredRowModel();
  const rowCount = getRowCount();

  return `${rowCount} matching assemblies of ${rows.length}`;
}
