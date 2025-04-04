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

export const useTable = (readRuns: ReadRun[] = []): Table<ReadRun> => {
  return useReactTable<ReadRun>({
    _features: [ROW_POSITION, ROW_PREVIEW],
    columns: [
      { ...(COLUMN_DEF.ROW_SELECTION as ColumnDef<ReadRun>), header: "" },
      {
        accessorKey: "run_accession",
        header: "Run Accession",
        meta: META,
      },
      {
        accessorKey: "fastq_ftp",
        header: "Fastq FTP",
        meta: META,
      },
      {
        accessorKey: "experiment_accession",
        header: "Experiment Accession",
        meta: META,
      },
      {
        accessorKey: "sample_accession",
        header: "Sample Accession",
        meta: META,
      },
      {
        accessorKey: "study_accession",
        header: "Study Accession",
        meta: META,
      },
      {
        accessorKey: "scientific_name",
        header: "Scientific Name",
        meta: META,
      },
      {
        accessorKey: "instrument_platform",
        header: "Instrument Platform",
        meta: META,
      },
      {
        accessorKey: "instrument_model",
        header: "Instrument Model",
        meta: META,
      },
      {
        accessorKey: "library_strategy",
        header: "Library Strategy",
        meta: META,
      },
      {
        accessorKey: "library_layout",
        header: "Library Layout",
        meta: META,
      },
      {
        accessorKey: "read_count",
        header: "Read Count",
        meta: META,
      },
      {
        accessorKey: "base_count",
        header: "Base Count",
        meta: META,
      },
    ],
    data: readRuns,
    enableMultiRowSelection: false,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.run_accession,
  });
};
