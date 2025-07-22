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
import { buildFastqFTP } from "./viewBuilders";

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
        header: "Run Accession",
        meta: { width: { max: "1fr", min: "140px" } },
      },
      {
        accessorKey: "fastq_ftp",
        cell: (props) => BasicCell(buildFastqFTP(props)),
        header: "Fastq FTP",
        meta: { width: { max: "1.8fr", min: "200px" } },
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
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.run_accession,
  });
};
