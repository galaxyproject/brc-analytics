import {
  ColumnDef,
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
import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { META } from "./constants";
import { BasicCell } from "../../components/Table/components/TableCell/components/BasicCell/basicCell";
import { useCallback, useMemo, useState } from "react";
import { buildFastqFTP } from "./viewBuilders";
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
    columns: [
      COLUMN_DEF.ROW_SELECTION as ColumnDef<ReadRun>,
      {
        accessorKey: "run_accession",
        filterFn: "arrIncludesSome",
        header: "Run Accession",
        meta: { width: { max: "1fr", min: "140px" } },
      },
      {
        accessorKey: "fastq_ftp",
        cell: (props) => BasicCell(buildFastqFTP(props)),
        filterFn: "arrIncludesSome",
        header: "Fastq FTP",
        meta: { width: { max: "1.8fr", min: "200px" } },
      },
      {
        accessorKey: "experiment_accession",
        filterFn: "arrIncludesSome",
        header: "Experiment Accession",
        meta: META,
      },
      {
        accessorKey: "sample_accession",
        filterFn: "arrIncludesSome",
        header: "Sample Accession",
        meta: META,
      },
      {
        accessorKey: "study_accession",
        filterFn: "arrIncludesSome",
        header: "Study Accession",
        meta: META,
      },
      {
        accessorKey: "scientific_name",
        filterFn: "arrIncludesSome",
        header: "Scientific Name",
        meta: META,
      },
      {
        accessorKey: "instrument_platform",
        filterFn: "arrIncludesSome",
        header: "Instrument Platform",
        meta: META,
      },
      {
        accessorKey: "instrument_model",
        filterFn: "arrIncludesSome",
        header: "Instrument Model",
        meta: META,
      },
      {
        accessorKey: "library_strategy",
        filterFn: "arrIncludesSome",
        header: "Library Strategy",
        meta: META,
      },
      {
        accessorKey: "library_layout",
        filterFn: "arrIncludesSome",
        header: "Library Layout",
        meta: META,
      },
      {
        accessorKey: "read_count",
        filterFn: "arrIncludesSome",
        header: "Read Count",
        meta: META,
      },
      {
        accessorKey: "base_count",
        filterFn: "arrIncludesSome",
        header: "Base Count",
        meta: META,
      },
    ],
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
