import { ColumnDef } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { META } from "./constants";
import { BasicCell } from "../../components/Table/components/TableCell/components/BasicCell/basicCell";
import { buildFastqFTP } from "./viewBuilders";

const RUN_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: "run_accession",
  filterFn: "arrIncludesSome",
  header: "Run Accession",
  meta: { width: { max: "1fr", min: "140px" } },
};

const FASTQ_FTP: ColumnDef<ReadRun> = {
  accessorKey: "fastq_ftp",
  cell: (props) => BasicCell(buildFastqFTP(props)),
  filterFn: "arrIncludesSome",
  header: "Fastq FTP",
  meta: { width: { max: "1.8fr", min: "200px" } },
};

const EXPERIMENT_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: "experiment_accession",
  filterFn: "arrIncludesSome",
  header: "Experiment Accession",
  meta: META,
};

const SAMPLE_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: "sample_accession",
  filterFn: "arrIncludesSome",
  header: "Sample Accession",
  meta: META,
};

const STUDY_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: "study_accession",
  filterFn: "arrIncludesSome",
  header: "Study Accession",
  meta: META,
};

const SCIENTIFIC_NAME: ColumnDef<ReadRun> = {
  accessorKey: "scientific_name",
  filterFn: "arrIncludesSome",
  header: "Scientific Name",
  meta: META,
};

const INSTRUMENT_PLATFORM: ColumnDef<ReadRun> = {
  accessorKey: "instrument_platform",
  filterFn: "arrIncludesSome",
  header: "Instrument Platform",
  meta: META,
};

const INSTRUMENT_MODEL: ColumnDef<ReadRun> = {
  accessorKey: "instrument_model",
  filterFn: "arrIncludesSome",
  header: "Instrument Model",
  meta: META,
};

const LIBRARY_STRATEGY: ColumnDef<ReadRun> = {
  accessorKey: "library_strategy",
  filterFn: "arrIncludesSome",
  header: "Library Strategy",
  meta: META,
};

const LIBRARY_LAYOUT: ColumnDef<ReadRun> = {
  accessorKey: "library_layout",
  filterFn: "arrIncludesSome",
  header: "Library Layout",
  meta: META,
};

const READ_COUNT: ColumnDef<ReadRun> = {
  accessorKey: "read_count",
  filterFn: "arrIncludesSome",
  header: "Read Count",
  meta: META,
};

const BASE_COUNT: ColumnDef<ReadRun> = {
  accessorKey: "base_count",
  filterFn: "arrIncludesSome",
  header: "Base Count",
  meta: META,
};

export const columns: ColumnDef<ReadRun>[] = [
  COLUMN_DEF.ROW_SELECTION as ColumnDef<ReadRun>,
  RUN_ACCESSION,
  FASTQ_FTP,
  EXPERIMENT_ACCESSION,
  SAMPLE_ACCESSION,
  STUDY_ACCESSION,
  SCIENTIFIC_NAME,
  INSTRUMENT_PLATFORM,
  INSTRUMENT_MODEL,
  LIBRARY_STRATEGY,
  LIBRARY_LAYOUT,
  READ_COUNT,
  BASE_COUNT,
];
