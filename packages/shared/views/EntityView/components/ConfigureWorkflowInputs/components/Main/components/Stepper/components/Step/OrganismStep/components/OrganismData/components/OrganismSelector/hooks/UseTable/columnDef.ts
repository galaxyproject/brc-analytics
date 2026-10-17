import { renderNTagCell } from "@repo/shared/components/Table/components/TableCell/components/NTagCell/utils";
import { renderScientificName } from "@repo/shared/components/Table/components/TableCell/components/ScientificName/utils";
import { buildOrganismTaxonomicGroup } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { SelectCell } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Table/components/TableCell/components/SelectCell/selectCell";
import type { ColumnDef, SortingColumnDef } from "@tanstack/react-table";
import {
  getOrganismAssemblyCount,
  getOrganismTaxonomicGroup,
} from "./accessorFn";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { type Organism } from "./types";
import { renderNumber } from "./viewBuilders";

const SELECT_FILTER_FN = "arrIncludesSome";

const SORTING_COLUMN_DEF: SortingColumnDef<Organism> = {
  enableSorting: true,
  sortUndefined: 1,
  sortingFn: "alphanumeric",
};

const ACTION: ColumnDef<Organism> = {
  cell: SelectCell,
  enableColumnFilter: false,
  enableSorting: false,
  header: "Action",
  id: "select",
  meta: { width: "max-content" },
};

const ASSEMBLY_COUNT: ColumnDef<Organism> = {
  accessorFn: getOrganismAssemblyCount,
  cell: renderNumber,
  enableColumnFilter: false,
  enableSorting: true,
  header: CATEGORY_CONFIGS.ASSEMBLY_COUNT.label,
  id: CATEGORY_CONFIGS.ASSEMBLY_COUNT.key,
  meta: { width: { max: "0.5fr", min: "120px" } },
  sortingFn: "basic",
};

const TAXONOMIC_GROUP: ColumnDef<Organism> = {
  accessorFn: getOrganismTaxonomicGroup,
  cell: renderNTagCell(buildOrganismTaxonomicGroup),
  enableSorting: true,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMIC_GROUP.label,
  id: CATEGORY_CONFIGS.TAXONOMIC_GROUP.key,
  meta: { width: { max: "0.5fr", min: "160px" } },
};

const TAXONOMIC_LEVEL_SPECIES: ColumnDef<Organism> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
  cell: renderScientificName,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.label,
  id: CATEGORY_CONFIGS.TAXONOMIC_LEVEL_SPECIES.key,
  meta: { width: { max: "1fr", min: "240px" } },
};

const TAXONOMY_ID: ColumnDef<Organism> = {
  ...SORTING_COLUMN_DEF,
  accessorKey: CATEGORY_CONFIGS.TAXONOMY_ID.key,
  filterFn: SELECT_FILTER_FN,
  header: CATEGORY_CONFIGS.TAXONOMY_ID.label,
  id: CATEGORY_CONFIGS.TAXONOMY_ID.key,
  meta: { width: { max: "0.5fr", min: "144px" } },
};

export const columns: ColumnDef<Organism>[] = [
  ACTION,
  TAXONOMIC_LEVEL_SPECIES,
  TAXONOMY_ID,
  TAXONOMIC_GROUP,
  ASSEMBLY_COUNT,
];
