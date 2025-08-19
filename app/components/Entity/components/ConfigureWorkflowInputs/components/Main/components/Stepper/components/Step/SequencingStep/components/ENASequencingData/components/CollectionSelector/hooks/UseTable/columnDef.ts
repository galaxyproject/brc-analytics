import { ColumnDef, ColumnMeta } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { buildFastqFTP } from "./viewBuilders";
import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { BasicCell } from "../../components/Table/components/TableCell/components/BasicCell/basicCell";
import { CATEGORY_CONFIGS } from "./categoryConfigs";

const RANGE_FILTER_FN = "inNumberRange";
const SELECT_FILTER_FN = "arrIncludesSome";

const META: ColumnMeta<ReadRun, unknown> = {
  width: { max: "1.2fr", min: "120px" },
};

const BASE_COUNT: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.BASE_COUNT.key,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.BASE_COUNT.label,
  meta: META,
};

const EXPERIMENT_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.EXPERIMENT_ACCESSION.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.EXPERIMENT_ACCESSION.label,
  meta: META,
};

const FASTQ_FTP: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.FASTQ_FTP.key,
  cell: (ctx) => BasicCell(buildFastqFTP(ctx)),
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.FASTQ_FTP.label,
  meta: { width: { max: "1.8fr", min: "200px" } },
};

const FIRST_CREATED: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.FIRST_CREATED.key,
  enableColumnFilter: false,
  header: CATEGORY_CONFIGS.FIRST_CREATED.label,
  meta: META,
};

const INSTRUMENT_MODEL: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.INSTRUMENT_MODEL.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.INSTRUMENT_MODEL.label,
  meta: META,
};

const INSTRUMENT_PLATFORM: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.INSTRUMENT_PLATFORM.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.INSTRUMENT_PLATFORM.label,
  meta: META,
};

const LIBRARY_LAYOUT: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.LIBRARY_LAYOUT.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.LIBRARY_LAYOUT.label,
  meta: META,
};

const LIBRARY_STRATEGY: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.LIBRARY_STRATEGY.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.LIBRARY_STRATEGY.label,
  meta: META,
};

const READ_COUNT: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.READ_COUNT.key,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.READ_COUNT.label,
  meta: META,
};

const RUN_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.RUN_ACCESSION.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.RUN_ACCESSION.label,
  meta: { width: { max: "1fr", min: "140px" } },
};

const SAMPLE_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.SAMPLE_ACCESSION.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.SAMPLE_ACCESSION.label,
  meta: META,
};

const SCIENTIFIC_NAME: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.SCIENTIFIC_NAME.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.SCIENTIFIC_NAME.label,
  meta: META,
};

const STUDY_ACCESSION: ColumnDef<ReadRun> = {
  accessorKey: CATEGORY_CONFIGS.STUDY_ACCESSION.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.STUDY_ACCESSION.label,
  meta: META,
};

export const columns: ColumnDef<ReadRun>[] = [
  COLUMN_DEF.ROW_SELECTION as ColumnDef<ReadRun>,
  RUN_ACCESSION,
  FIRST_CREATED,
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
