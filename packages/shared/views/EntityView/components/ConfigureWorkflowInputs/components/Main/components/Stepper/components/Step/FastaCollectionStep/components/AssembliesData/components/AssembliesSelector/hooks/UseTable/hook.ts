import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import type { Workflow } from "@repo/shared/apis/workflow";
import { workflowReachesAssemblyMaximum } from "@repo/shared/workflow/utils";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { INITIAL_STATE, META, NO_ASSEMBLIES } from "./constants";
import { type Assembly, type UseTable } from "./types";
import {
  buildColumns,
  buildEnableRowSelection,
  buildGetRowSelectionValidation,
  getAssemblyRowId,
} from "./utils";

export const useTable = (
  assemblies: Assembly[] | undefined,
  workflow: Workflow
): UseTable => {
  // The selection in the dialog; the configured input is only updated when
  // the user adds the selection.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { assemblyCountMax } = workflow;

  const columns = useMemo(
    () => buildColumns(assemblyCountMax),
    [assemblyCountMax]
  );

  const isMaxReached = workflowReachesAssemblyMaximum(
    assemblyCountMax,
    Object.keys(rowSelection).length
  );

  const table = useReactTable<Assembly>({
    _features: [
      ROW_POSITION,
      ROW_PREVIEW,
      ROW_SELECTION_VALIDATION,
      TABLE_DOWNLOAD,
    ],
    columns,
    data: assemblies ?? NO_ASSEMBLIES,
    downloadFilename: "assemblies",
    enableColumnFilters: true,
    enableFilters: true,
    enableMultiRowSelection: true,
    enableMultiSort: true,
    enableRowSelection: buildEnableRowSelection(isMaxReached),
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
    getRowId: getAssemblyRowId,
    getRowSelectionValidation: buildGetRowSelectionValidation(
      isMaxReached,
      assemblyCountMax
    ),
    getSortedRowModel: getSortedRowModel(),
    initialState: INITIAL_STATE,
    meta: META,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  return { table };
};
