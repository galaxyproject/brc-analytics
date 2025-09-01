import {
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { columns } from "./columnDef";
import { useCallback, useMemo, useState } from "react";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { ColumnFiltersState, Updater } from "@tanstack/react-table";
import { UseENADataByAccession } from "../../../../hooks/UseENADataByAccession/types";
import { UseENADataByTaxonomyId } from "../../../../hooks/UseENADataByTaxonomyId/types";
import { ENA_QUERY_METHOD } from "../../../../../../types";
import { updateColumnFilters } from "./utils";
import { SORTING } from "./constants";
import { getSortedRowModel } from "@tanstack/react-table";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";

export const useTable = (
  enaQueryMethod: ENA_QUERY_METHOD,
  enaAccession: UseENADataByAccession<ReadRun>,
  enaTaxonomyId: UseENADataByTaxonomyId<ReadRun>
): Table<ReadRun> => {
  const [columnFiltersByMethod, setColumnFiltersByMethod] = useState<
    Record<ENA_QUERY_METHOD, ColumnFiltersState>
  >({
    [ENA_QUERY_METHOD.ACCESSION]: [],
    [ENA_QUERY_METHOD.TAXONOMY_ID]: [],
  });

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

  const data = useMemo(() => readRuns || [], [readRuns]);

  const initialState = { sorting: SORTING };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    enaQueryMethod,
    filterSort: FILTER_SORT.COUNT,
  };

  const state = { columnFilters: columnFiltersByMethod[enaQueryMethod] };

  return useReactTable<ReadRun>({
    _features: [ROW_POSITION, ROW_PREVIEW],
    columns,
    data,
    enableColumnFilters: true,
    enableFilters: true,
    enableRowSelection: true,
    enableSorting: true,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.run_accession,
    getSortedRowModel: getSortedRowModel(),
    initialState,
    meta,
    onColumnFiltersChange,
    state,
  });
};
