import {
  functionalUpdate,
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

export const useTable = (
  readRuns: ReadRun[] | undefined = []
): Table<ReadRun> => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const onColumnFiltersChange = useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>): void => {
      setColumnFilters((old) => functionalUpdate(updaterOrValue, old));
    },
    [setColumnFilters]
  );

  const data = useMemo(() => readRuns, [readRuns]);

  const state = { columnFilters };

  return useReactTable<ReadRun>({
    _features: [ROW_POSITION, ROW_PREVIEW],
    columns,
    data,
    enableColumnFilters: true,
    enableFilters: true,
    enableRowSelection: true,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.run_accession,
    onColumnFiltersChange,
    state,
  });
};
