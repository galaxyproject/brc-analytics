import {
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  InitialTableState,
  useReactTable,
} from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { columns } from "./columnDef";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { ColumnFiltersState } from "@tanstack/react-table";
import { UseENADataByTaxonomyId } from "../../../../hooks/UseENADataByTaxonomyId/types";
import { enableRowSelection, getRowSelectionValidation } from "./utils";
import { SORTING } from "./constants";
import { getSortedRowModel } from "@tanstack/react-table";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { UseTable } from "./types";

export const useTable = (
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>,
  columnFilters: ColumnFiltersState
): UseTable => {
  const [data, setData] = useState<ReadRun[]>([]);

  // TaxonomyId ena read runs; store for easy switching between data sources.
  const taxonomyData = useMemo(
    () => sanitizeReadRuns(mapReadRuns(enaTaxonomyId.data)),
    [enaTaxonomyId.data]
  );

  // Initialize table with taxonomyId ena data.
  useEffect(() => {
    setData(taxonomyData);
  }, [taxonomyData]);

  const initialState: InitialTableState = { columnFilters, sorting: SORTING };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
  };

  const table = useReactTable<ReadRun>({
    _features: [
      ROW_POSITION,
      ROW_PREVIEW,
      ROW_SELECTION_VALIDATION,
      TABLE_DOWNLOAD,
    ],
    columns,
    data,
    downloadFilename: "read-runs",
    enableColumnFilters: true,
    enableFilters: true,
    enableMultiSort: true,
    enableRowSelection,
    enableRowSelectionValidation: true,
    enableSorting: true,
    enableSortingInteraction: true,
    enableSortingRemoval: false,
    enableTableDownload: true,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.run_accession,
    getRowSelectionValidation,
    getSortedRowModel: getSortedRowModel(),
    initialState,
    meta,
  });

  /**
   * Callback to switch table data.
   * Table state is reset (column filters, sorting, row selection) when the browsing method has changed.
   */
  const switchBrowseMethod = useCallback(
    (data?: BaseReadRun[]) => {
      // Handle switching table data.
      if (data) setData(sanitizeReadRuns(mapReadRuns(data)));
      else setData(taxonomyData);

      // Reset table state.
      table.resetColumnFilters();
      table.resetSorting();
      table.resetRowSelection();
    },
    [table, taxonomyData]
  );

  return { actions: { switchBrowseMethod }, table };
};
