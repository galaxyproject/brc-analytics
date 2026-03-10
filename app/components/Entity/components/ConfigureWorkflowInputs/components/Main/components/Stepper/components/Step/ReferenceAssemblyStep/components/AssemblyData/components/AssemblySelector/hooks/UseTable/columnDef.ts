import { ColumnDef, SortingColumnDef } from "@tanstack/react-table";
import {
  buildNTagProps,
  renderNTagCell,
} from "../../../../../../../../../../../../../../../../common/Table/components/TableCell/components/NTagCell/utils";
import { SelectCell } from "../../components/Table/components/TableCell/components/SelectCell/selectCell";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { Assembly } from "./types";
import { renderIsRef, renderNumber, renderPloidy } from "./viewBuilders";

const RANGE_FILTER_FN = "inNumberRange";
const SELECT_FILTER_FN = "arrIncludesSome";

const SORTING_COLUMN_DEF: SortingColumnDef<Assembly> = {
  enableSorting: true,
  sortUndefined: 1,
  sortingFn: "alphanumeric",
};

const ACCESSION: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.ACCESSION.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.ACCESSION.label,
  id: CATEGORY_CONFIGS.ACCESSION.key,
  meta: { width: { max: "1fr", min: "164px" } },
};

const ACTION: ColumnDef<Assembly> = {
  cell: SelectCell,
  enableColumnFilter: false,
  enableSorting: false,
  header: "Action",
  id: "select",
  meta: { width: "max-content" },
};

const ANNOTATION_STATUS: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.ANNOTATION_STATUS.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.ANNOTATION_STATUS.label,
  id: CATEGORY_CONFIGS.ANNOTATION_STATUS.key,
  meta: { width: { max: "1fr", min: "164px" } },
};

const CHROMOSOMES: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.CHROMOSOMES.key,
  cell: renderNumber,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.CHROMOSOMES.label,
  id: CATEGORY_CONFIGS.CHROMOSOMES.key,
  meta: { width: { max: "0.5fr", min: "144px" } },
};

const COVERAGE: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.COVERAGE.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.COVERAGE.label,
  id: CATEGORY_CONFIGS.COVERAGE.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
};

const GC_PERCENT: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.GC_PERCENT.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.GC_PERCENT.label,
  id: CATEGORY_CONFIGS.GC_PERCENT.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
};

const IS_REF: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.IS_REF.key,
  cell: renderIsRef,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.IS_REF.label,
  id: CATEGORY_CONFIGS.IS_REF.key,
  meta: { width: { max: "0.5fr", min: "100px" } },
};

const LENGTH: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.LENGTH.key,
  cell: renderNumber,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.LENGTH.label,
  id: CATEGORY_CONFIGS.LENGTH.key,
  meta: { width: { max: "0.5fr", min: "132px" } },
};

const LEVEL: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.LEVEL.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.LEVEL.label,
  id: CATEGORY_CONFIGS.LEVEL.key,
  meta: { width: { max: "0.5fr", min: "142px" } },
};

const PLOIDY: ColumnDef<Assembly> = {
  accessorKey: CATEGORY_CONFIGS.PLOIDY.key,
  cell: renderPloidy,
  enableSorting: true,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.PLOIDY.label,
  id: CATEGORY_CONFIGS.PLOIDY.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
};

const SCAFFOLD_COUNT: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.SCAFFOLD_COUNT.key,
  cell: renderNumber,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.SCAFFOLD_COUNT.label,
  id: CATEGORY_CONFIGS.SCAFFOLD_COUNT.key,
  meta: { width: { max: "0.5fr", min: "132px" } },
};

const SCAFFOLD_L50: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.SCAFFOLD_L50.key,
  cell: renderNumber,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.SCAFFOLD_L50.label,
  id: CATEGORY_CONFIGS.SCAFFOLD_L50.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
};

const SCAFFOLD_N50: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.SCAFFOLD_N50.key,
  cell: renderNumber,
  filterFn: RANGE_FILTER_FN,
  header: CATEGORY_CONFIGS.SCAFFOLD_N50.label,
  id: CATEGORY_CONFIGS.SCAFFOLD_N50.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
};

const TAXONOMIC_GROUP: ColumnDef<Assembly> = {
  accessorKey: CATEGORY_CONFIGS.TAXONOMIC_GROUP.key,
  cell: renderNTagCell(buildNTagProps("taxonomic groups", "taxonomicGroup")),
  enableSorting: true,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMIC_GROUP.label,
  id: CATEGORY_CONFIGS.TAXONOMIC_GROUP.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
};

const TAXONOMIC_LEVEL_SPECIES: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.label,
  id: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
  meta: { width: { max: "1fr", min: "200px" } },
};

const TAXONOMIC_LEVEL_STRAIN: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_STRAIN.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_STRAIN.label,
  id: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_STRAIN.key,
  meta: { width: { max: "0.5fr", min: "160px" } },
};

const TAXONOMY_ID: ColumnDef<Assembly> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.TAXONOMY_ID.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMY_ID.label,
  id: CATEGORY_CONFIGS.TAXONOMY_ID.key,
  meta: { width: { max: "0.5fr", min: "144px" } },
};

export const columns: ColumnDef<Assembly>[] = [
  ACTION,
  ACCESSION,
  TAXONOMIC_LEVEL_SPECIES,
  TAXONOMIC_LEVEL_STRAIN,
  PLOIDY,
  TAXONOMY_ID,
  TAXONOMIC_GROUP,
  IS_REF,
  LEVEL,
  CHROMOSOMES,
  LENGTH,
  SCAFFOLD_COUNT,
  SCAFFOLD_N50,
  SCAFFOLD_L50,
  COVERAGE,
  GC_PERCENT,
  ANNOTATION_STATUS,
];
