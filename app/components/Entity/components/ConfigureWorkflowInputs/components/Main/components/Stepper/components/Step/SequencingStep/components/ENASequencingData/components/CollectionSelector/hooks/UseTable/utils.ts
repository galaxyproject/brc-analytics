import { Row, Table } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";

/**
 * Checks if the row is selectable.
 * @param row - Row to check.
 * @returns True if the row is selectable, false otherwise.
 */
export function enableRowSelection(row: Row<ReadRun>): boolean {
  return row.original.validation.isValid;
}

/**
 * Returns the row selection validation message for a row.
 * @param row - Row.
 * @returns The row selection validation message for the row.
 */
export function getRowSelectionValidation(
  row: Row<ReadRun>
): string | undefined {
  return row.original.validation.error;
}

/** Renders the summary row counts for the table.
 * @param table - Table instance.
 * @returns The summary row counts for the table.
 */
export function renderSummary(table: Table<ReadRun>): string {
  const { getPreFilteredRowModel, getRowCount } = table;
  const { rows } = getPreFilteredRowModel();
  const rowCount = getRowCount();

  return `${rowCount} matching run${rowCount === 1 ? "" : "s"} of ${rows.length}`;
}
