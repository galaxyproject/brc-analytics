import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  InitialTableState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Workflow } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { getEntities } from "../../../../../../../../../../../../../../../../../services/workflows/query";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { columns } from "./columnDef";
import { SORTING } from "./constants";
import { mapAssembly } from "./dataTransforms";
import { Assembly, UseTable } from "./types";
import {
  enableRowSelection,
  getInitialColumnFilters,
  getRowSelectionValidation,
  renderSummary,
} from "./utils";

export const useTable = (workflow: Workflow): UseTable => {
  const assemblies = useMemo(
    () => mapAssembly(getEntities<Assembly>("assemblies"), workflow),
    [workflow]
  );

  const data = useMemo(() => assemblies, [assemblies]);

  const columnFilters = useMemo(
    () => getInitialColumnFilters(workflow),
    [workflow]
  );

  const initialState: InitialTableState = {
    columnFilters,
    sorting: SORTING,
  };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
    summaryFn: renderSummary,
  };

  const table = useReactTable<Assembly>({
    _features: [
      ROW_POSITION,
      ROW_PREVIEW,
      ROW_SELECTION_VALIDATION,
      TABLE_DOWNLOAD,
    ],
    columns,
    data,
    downloadFilename: "assemblies",
    enableColumnFilters: true,
    enableFilters: true,
    enableMultiRowSelection: false,
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
    getRowId: (row) => row.accession,
    getRowSelectionValidation,
    getSortedRowModel: getSortedRowModel(),
    initialState,
    meta,
  });

  return { table };
};
