import { ColumnFiltersState, Row } from "@tanstack/react-table";
import { ReadRun } from "../../../../../../types";
import { COLUMN_KEY_TO_LABEL } from "./constants";

/**
 * Builds a list of messages for column filter mismatches.
 * @param initialColumnFilters - Pre-selected column filters.
 * @param rows - Selected rows.
 * @returns Array of messages.
 */
export function buildRequirementsMatches(
  initialColumnFilters: ColumnFiltersState,
  rows: Row<ReadRun>[]
): string[] {
  const messages = [];
  // Iterate over column filters to find row data that does not match the expected pre-filter value.
  for (const { id, value } of initialColumnFilters) {
    if (!Array.isArray(value)) continue; // Type check; value is always an array.

    const key = id as keyof ReadRun;

    // Build a set of unmatched values.
    const unmatchedSet: Set<ReadRun[keyof ReadRun]> = new Set();
    for (const row of rows) {
      // Get the value of the column for the row.
      const rowValue = row.original[key];

      // Compare the row value to the expected value.
      if (value.includes(rowValue)) continue;

      // Add the unmatched value to the set.
      unmatchedSet.add(rowValue);
    }

    if (unmatchedSet.size === 0) continue;

    // If there are unmatched values, add a message.
    messages.push(getMessage(key, value, unmatchedSet));
  }

  return messages;
}

/**
 * Builds a message for a column filter mismatch.
 * @param key - Column key.
 * @param value - Expected values.
 * @param ummatchedSet - Set of unmatched values.
 * @returns A message string.
 */
function getMessage(
  key: keyof ReadRun,
  value: ReadRun[keyof ReadRun][],
  ummatchedSet: Set<ReadRun[keyof ReadRun]>
): string {
  return `${COLUMN_KEY_TO_LABEL[key]} mismatch: expected ${value.join(" OR ")}, but ${[...ummatchedSet].join(", ")} selected`;
}
