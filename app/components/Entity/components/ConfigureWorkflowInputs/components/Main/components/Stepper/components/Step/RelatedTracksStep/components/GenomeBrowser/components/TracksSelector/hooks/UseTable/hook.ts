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
import { useMemo } from "react";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { GROUPING, SORTING, COLUMN_VISIBILITY } from "./constants";
import { getSortedRowModel } from "@tanstack/react-table";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import { UseUCSCTracks } from "../../../../../../hooks/UseUCSCTracks/types";
import { mapTrackGroups, sanitizeTracks } from "./dataTransforms";
import { Track } from "./types";

export const useTable = (ucscTracks: UseUCSCTracks): Table<Track> => {
  const { data: trackGroups } = ucscTracks;
  console.log("ORIGIANL", trackGroups?.map((t) => t.tracks).flat());

  const data = useMemo(
    () => sanitizeTracks(mapTrackGroups(trackGroups)) || [],
    [trackGroups]
  );

  const initialState: InitialTableState = {
    columnVisibility: COLUMN_VISIBILITY,
    grouping: GROUPING,
    sorting: SORTING,
  };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
  };

  return useReactTable<Track>({
    _features: [ROW_POSITION, ROW_PREVIEW, TABLE_DOWNLOAD],
    columns,
    data,
    enableColumnFilters: true,
    enableExpanding: true,
    enableFilters: true,
    enableGrouping: true,
    enableHiding: true,
    enableMultiRowSelection: true,
    enableRowSelection: true,
    enableSorting: false,
    enableSortingInteraction: false,
    enableSubRowSelection: true,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    // getRowCanExpand: (row) => row.original.isComposite,
    getRowId: (row) => row.bigDataUrl,
    getSortedRowModel: getSortedRowModel(),
    initialState,
    meta,
  });
};
