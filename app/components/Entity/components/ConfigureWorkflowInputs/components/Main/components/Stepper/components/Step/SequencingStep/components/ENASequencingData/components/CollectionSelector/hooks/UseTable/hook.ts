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
import { useCallback, useMemo } from "react";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { ColumnFiltersState } from "@tanstack/react-table";
import { UseENADataByAccession } from "../../../../hooks/UseENADataByAccession/types";
import { UseENADataByTaxonomyId } from "../../../../hooks/UseENADataByTaxonomyId/types";
import { ENA_QUERY_METHOD } from "../../../../../../types";
import { enableRowSelection, getRowSelectionValidation } from "./utils";
import { SORTING } from "./constants";
import { getSortedRowModel } from "@tanstack/react-table";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { TableMeta, UseTable } from "./types";

export const useTable = (
  enaQueryMethod: ENA_QUERY_METHOD,
  enaAccession: UseENADataByAccession<BaseReadRun>,
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>,
  columnFilters: ColumnFiltersState
): UseTable => {
  // Get the data for the ENA query method (by accession or by taxonomy ID).
  const { data: readRuns } =
    enaQueryMethod === ENA_QUERY_METHOD.ACCESSION
      ? enaAccession
      : enaTaxonomyId;

  const data = useMemo(
    () => sanitizeReadRuns(mapReadRuns(readRuns)),
    [readRuns]
  );

  const initialState: InitialTableState = { columnFilters, sorting: SORTING };

  const meta: TableMeta = {
    categoryGroups: CATEGORY_GROUPS,
    enaQueryMethod,
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

  const switchToAccession = useCallback((data: BaseReadRun[]) => {
    console.log("switch to accession", data);
  }, []);

  return { actions: { switchToAccession }, table };
};
