import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import { UseQueryResult } from "@tanstack/react-query";
import {
  functionalUpdate,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  InitialTableState,
  TableState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OnConfigure } from "../../../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { BaseReadRun, ReadRun } from "../../../../types";
import { getSequencingData } from "../../../../utils";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { columns } from "./columnDef";
import { COLUMN_VISIBILITY, SORTING } from "./constants";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { UseTable } from "./types";
import {
  enableRowSelection,
  getRowSelectionValidation,
  getSelectedRows,
  renderSummary,
} from "./utils";

export const useTable = (
  enaTaxonomyId: UseQueryResult<BaseReadRun[]>,
  {
    columnFilters,
    rowSelection,
  }: Pick<TableState, "columnFilters" | "rowSelection">,
  onConfigure: OnConfigure
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

  const initialState: InitialTableState = {
    columnFilters,
    columnVisibility: COLUMN_VISIBILITY,
    sorting: SORTING,
  };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    filterSort: FILTER_SORT.COUNT,
    summaryFn: renderSummary,
  };

  const state: Partial<TableState> = { rowSelection };

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
    onRowSelectionChange: (updater) => {
      const nextRowSelection = functionalUpdate(updater, rowSelection);
      onConfigure(getSequencingData(getSelectedRows(data, nextRowSelection)));
    },
    state,
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
