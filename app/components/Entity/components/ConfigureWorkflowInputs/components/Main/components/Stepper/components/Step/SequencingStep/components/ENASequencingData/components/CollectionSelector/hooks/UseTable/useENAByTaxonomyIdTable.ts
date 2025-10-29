import { InitialTableState, Table, useReactTable } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnFiltersState, Updater } from "@tanstack/react-table";
import { UseENADataByTaxonomyId } from "../../../../hooks/UseENADataByTaxonomyId/types";
import { updateColumnFilters } from "./utils";
import { SORTING } from "./constants";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { TABLE_OPTIONS } from "./tableOptions";

export const useENAByTaxonomyIdTable = (
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>
): Table<ReadRun> => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Grab the column filters for ENA by taxonomy ID.
  const { columnFilters: initialColumnFilters, data: readRuns } = enaTaxonomyId;

  useEffect(() => {
    if (initialColumnFilters.length === 0) return;
    // Pre-filter the table data for ENA by taxonomy ID.
    setColumnFilters(updateColumnFilters(initialColumnFilters));
  }, [initialColumnFilters]);

  const onColumnFiltersChange = useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>): void =>
      setColumnFilters(updateColumnFilters(updaterOrValue)),
    []
  );

  const data = useMemo(
    () => sanitizeReadRuns(mapReadRuns(readRuns)),
    [readRuns]
  );

  const initialState: InitialTableState = { sorting: SORTING };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
  };

  const state = { columnFilters };

  return useReactTable<ReadRun>({
    ...TABLE_OPTIONS,
    data,
    initialState,
    meta,
    onColumnFiltersChange,
    state,
  });
};
