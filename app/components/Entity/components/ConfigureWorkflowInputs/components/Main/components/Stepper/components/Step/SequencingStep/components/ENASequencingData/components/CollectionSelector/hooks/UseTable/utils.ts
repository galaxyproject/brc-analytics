import {
  ColumnFiltersState,
  Row,
  Updater,
  functionalUpdate,
} from "@tanstack/react-table";
import { ENA_QUERY_METHOD } from "../../../../../../types";
import { ReadRun } from "../../../../types";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

/**
 * Checks if the row is selectable.
 * @param row - Row to check.
 * @returns True if the row is selectable, false otherwise.
 */
export function enableRowSelection(row: Row<ReadRun>): boolean {
  return row.getValue(CATEGORY_CONFIGS.VALIDATION.key);
}

/**
 * Returns the row selection validation message for a row.
 * @param row - Row.
 * @returns The row selection validation message for the row.
 */
export function getRowSelectionValidation(
  row: Row<ReadRun>
): string | undefined {
  return row.getValue(CATEGORY_CONFIGS.VALIDATION.key)
    ? undefined
    : `"PAIRED" read run. Number of files not equal to two.`;
}

/**
 * Updates the column filters for the specified ENA query method.
 * @param enaQueryMethod - ENA query method.
 * @param updaterOrValue - Updater or value.
 * @returns Updated column filter state for the specified ENA query method.
 */
export function updateColumnFilters(
  enaQueryMethod: ENA_QUERY_METHOD,
  updaterOrValue: Updater<ColumnFiltersState>
): (
  old: Record<ENA_QUERY_METHOD, ColumnFiltersState>
) => Record<ENA_QUERY_METHOD, ColumnFiltersState> {
  return (old: Record<ENA_QUERY_METHOD, ColumnFiltersState>) => {
    return {
      ...old,
      [enaQueryMethod]: functionalUpdate(updaterOrValue, old[enaQueryMethod]),
    };
  };
}
