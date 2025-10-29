import { InitialTableState, Table, useReactTable } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnFiltersState, Updater } from "@tanstack/react-table";
import { UseENADataByAccession } from "../../../../hooks/UseENADataByAccession/types";
import { UseENADataByTaxonomyId } from "../../../../hooks/UseENADataByTaxonomyId/types";
import { ENA_QUERY_METHOD } from "../../../../../../types";
import { updateColumnFilters } from "./utils";
import { SORTING } from "./constants";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { TABLE_OPTIONS } from "./tableOptions";

export const useTable = (
  enaQueryMethod: ENA_QUERY_METHOD,
  enaAccession: UseENADataByAccession<BaseReadRun>,
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>
): Table<ReadRun> => {
  const [columnFiltersByMethod, setColumnFiltersByMethod] = useState<
    Record<ENA_QUERY_METHOD, ColumnFiltersState>
  >({
    [ENA_QUERY_METHOD.ACCESSION]: [],
    [ENA_QUERY_METHOD.TAXONOMY_ID]: [],
  });

  // Grab the column filters for ENA by taxonomy ID.
  const { columnFilters } = enaTaxonomyId;

  useEffect(() => {
    if (columnFilters.length === 0) return;
    // Pre-filter the table data for ENA by taxonomy ID.
    setColumnFiltersByMethod(
      updateColumnFilters(ENA_QUERY_METHOD.TAXONOMY_ID, columnFilters)
    );
  }, [columnFilters]);

  const onColumnFiltersChange = useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>): void =>
      setColumnFiltersByMethod(
        updateColumnFilters(enaQueryMethod, updaterOrValue)
      ),
    [enaQueryMethod]
  );

  // Get the data for the ENA query method (by accession or by taxonomy ID).
  const { data: readRuns } =
    enaQueryMethod === ENA_QUERY_METHOD.ACCESSION
      ? enaAccession
      : enaTaxonomyId;

  const data = useMemo(
    () => sanitizeReadRuns(mapReadRuns(readRuns)),
    [readRuns]
  );

  const initialState: InitialTableState = { sorting: SORTING };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    enaQueryMethod,
    filterSort: FILTER_SORT.COUNT,
  };

  const state = { columnFilters: columnFiltersByMethod[enaQueryMethod] };

  return useReactTable<ReadRun>({
    ...TABLE_OPTIONS,
    data,
    initialState,
    meta,
    onColumnFiltersChange,
    state,
  });
};
