import { InitialTableState, Table, useReactTable } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";
import { useEffect, useMemo } from "react";
import { UseENADataByTaxonomyId } from "../../../../hooks/UseENADataByTaxonomyId/types";
import { SORTING } from "./constants";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { TABLE_OPTIONS } from "./tableOptions";

export const useENAByTaxonomyIdTable = (
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>
): Table<ReadRun> => {
  const { columnFilters, data: readRuns } = enaTaxonomyId;

  const data = useMemo(
    () => sanitizeReadRuns(mapReadRuns(readRuns)),
    [readRuns]
  );

  const initialState: InitialTableState = { sorting: SORTING };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
  };

  const table = useReactTable<ReadRun>({
    ...TABLE_OPTIONS,
    data,
    initialState,
    meta,
  });

  const { setColumnFilters } = table;

  useEffect(() => {
    if (columnFilters.length === 0) return;
    // Pre-filter the table data for ENA by taxonomy ID.
    setColumnFilters(columnFilters);
  }, [columnFilters, setColumnFilters]);

  return table;
};
