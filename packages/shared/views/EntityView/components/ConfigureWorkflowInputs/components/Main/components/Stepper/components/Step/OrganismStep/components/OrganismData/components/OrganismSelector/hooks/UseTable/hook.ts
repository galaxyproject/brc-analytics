import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { ROW_SELECTION_VALIDATION } from "@databiosphere/findable-ui/lib/components/Table/features/RowSelectionValidation/constants";
import { TABLE_DOWNLOAD } from "@databiosphere/findable-ui/lib/components/Table/features/TableDownload/constants";
import type { Workflow } from "@repo/shared/apis/workflow";
import { getCladeOrganisms } from "@repo/shared/workflow/cladeOrganisms";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { columns } from "./columnDef";
import { INITIAL_STATE, META } from "./constants";
import { type Organism, type UseTable } from "./types";
import {
  buildEnableOrganismSelection,
  buildGetOrganismSelectionValidation,
} from "./utils";

export const useTable = (workflow: Workflow): UseTable => {
  // Only organisms within the workflow's clade are listed — the clade is a
  // constraint of the workflow, not a filter the user can clear.
  const data = useMemo(() => getCladeOrganisms(workflow), [workflow]);

  const table = useReactTable<Organism>({
    _features: [
      ROW_POSITION,
      ROW_PREVIEW,
      ROW_SELECTION_VALIDATION,
      TABLE_DOWNLOAD,
    ],
    columns,
    data,
    downloadFilename: "organisms",
    enableColumnFilters: true,
    enableFilters: true,
    enableMultiRowSelection: false,
    enableMultiSort: true,
    enableRowSelection: buildEnableOrganismSelection(workflow),
    enableRowSelectionValidation: true,
    enableSorting: true,
    enableSortingInteraction: true,
    enableSortingRemoval: false,
    enableTableDownload: true,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.ncbiTaxonomyId,
    getRowSelectionValidation: buildGetOrganismSelectionValidation(workflow),
    getSortedRowModel: getSortedRowModel(),
    initialState: INITIAL_STATE,
    meta: META,
  });

  return { table };
};
