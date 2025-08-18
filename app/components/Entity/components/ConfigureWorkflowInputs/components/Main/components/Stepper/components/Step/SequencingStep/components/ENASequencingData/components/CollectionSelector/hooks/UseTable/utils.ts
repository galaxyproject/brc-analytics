import {
  ColumnFiltersState,
  Updater,
  functionalUpdate,
} from "@tanstack/react-table";
import { ENA_QUERY_METHOD } from "../../../../../../types";

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
