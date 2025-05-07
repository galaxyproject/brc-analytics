import {
  ColumnDef,
  getCoreRowModel,
  Table,
  useReactTable,
} from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { META } from "./constants";
import { BasicCell } from "../../components/Table/components/TableCell/components/BasicCell/basicCell";
import { useMemo } from "react";
import { getFastqFTP } from "./accessorFn";

export const useTable = (
  readRuns: ReadRun[] | undefined = []
): Table<ReadRun> => {
  const data = useMemo(() => readRuns, [readRuns]);
  return useReactTable<ReadRun>({
    _features: [ROW_POSITION, ROW_PREVIEW],
    columns: [
      COLUMN_DEF.ROW_SELECTION as ColumnDef<ReadRun>,
      {
        accessorKey: "run_accession",
        cell: BasicCell,
        header: "Run Accession",
        meta: { width: { max: "1fr", min: "140px" } },
      },
      {
        accessorFn: getFastqFTP,
        cell: BasicCell,
        header: "Fastq FTP",
        meta: { width: { max: "1.8fr", min: "200px" } },
      },
      {
        accessorKey: "experiment_accession",
        cell: BasicCell,
        header: "Experiment Accession",
        meta: META,
      },
      {
        accessorKey: "sample_accession",
        cell: BasicCell,
        header: "Sample Accession",
        meta: META,
      },
      {
        accessorKey: "study_accession",
        cell: BasicCell,
        header: "Study Accession",
        meta: META,
      },
      {
        accessorKey: "scientific_name",
        cell: BasicCell,
        header: "Scientific Name",
        meta: META,
      },
      {
        accessorKey: "instrument_platform",
        cell: BasicCell,
        header: "Instrument Platform",
        meta: META,
      },
      {
        accessorKey: "instrument_model",
        cell: BasicCell,
        header: "Instrument Model",
        meta: META,
      },
      {
        accessorKey: "library_strategy",
        cell: BasicCell,
        header: "Library Strategy",
        meta: META,
      },
      {
        accessorKey: "library_layout",
        cell: BasicCell,
        header: "Library Layout",
        meta: META,
      },
      {
        accessorKey: "read_count",
        cell: BasicCell,
        header: "Read Count",
        meta: META,
      },
      {
        accessorKey: "base_count",
        cell: BasicCell,
        header: "Base Count",
        meta: META,
      },
    ],
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.run_accession,
  });
};
