import { Row } from "@tanstack/react-table";
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
