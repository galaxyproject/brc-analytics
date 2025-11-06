import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  InitialTableState,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { columns } from "./columnDef";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { GROUPING, COLUMN_VISIBILITY } from "./constants";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import { UseUCSCTracks } from "../../../../../../hooks/UseUCSCTracks/types";
import { UcscTrackNode } from "../../../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export const useTable = (ucscTracks: UseUCSCTracks): Table<UcscTrackNode> => {
  const data = ucscTracks.data ?? [];

  const initialState: InitialTableState = {
    columnVisibility: COLUMN_VISIBILITY,
    grouping: GROUPING,
  };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
  };

  return useReactTable<UcscTrackNode>({
    _features: [ROW_POSITION, ROW_PREVIEW, TABLE_DOWNLOAD],
    columns,
    data,
    enableColumnFilters: true,
    enableExpanding: true,
    enableFilters: true,
    enableGrouping: true,
    enableHiding: true,
    enableMultiRowSelection: true,
    enableRowSelection: (row) => !row.original.isComposite,
    enableSorting: false,
    enableSortingInteraction: false,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getRowId: (row, i) =>
      row.isComposite ? row.shortLabel || String(i) : row.bigDataUrl,
    getSubRows: (row) => (row.isComposite ? row.tracks : []),
    initialState,
    meta,
  });
};
