import {
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  TableOptions,
} from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { columns } from "./columnDef";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { enableRowSelection, getRowSelectionValidation } from "./utils";
import { getSortedRowModel } from "@tanstack/react-table";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";

export const TABLE_OPTIONS: Omit<TableOptions<ReadRun>, "data"> = {
  _features: [
    ROW_POSITION,
    ROW_PREVIEW,
    ROW_SELECTION_VALIDATION,
    TABLE_DOWNLOAD,
  ],
  columns,
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
};
