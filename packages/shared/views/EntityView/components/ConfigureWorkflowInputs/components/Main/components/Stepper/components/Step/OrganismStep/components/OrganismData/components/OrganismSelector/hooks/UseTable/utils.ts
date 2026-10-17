import { type Table } from "@tanstack/react-table";
import { type Organism } from "./types";

/** Renders the summary row counts for the table.
 * @param table - Table instance.
 * @returns The summary row counts for the table.
 */
export function renderSummary(table: Table<Organism>): string {
  const { getPreFilteredRowModel, getRowCount } = table;
  const { rows } = getPreFilteredRowModel();
  const rowCount = getRowCount();

  return `${rowCount} matching ${rowCount === 1 ? "organism" : "organisms"} of ${rows.length}`;
}
