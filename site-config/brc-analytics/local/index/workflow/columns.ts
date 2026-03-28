import { ColumnDef } from "@tanstack/react-table";
import { CATEGORY_CONFIG } from "./categoryGroupConfig";
import { WorkflowEntity } from "./types";

const CATEGORY: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.CATEGORY.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.CATEGORY.label,
  id: CATEGORY_CONFIG.CATEGORY.key,
};

const COMMON_NAME: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.COMMON_NAME.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.COMMON_NAME.label,
  id: CATEGORY_CONFIG.COMMON_NAME.key,
};

const PLOIDY: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.PLOIDY.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.PLOIDY.label,
  id: CATEGORY_CONFIG.PLOIDY.key,
};

const SCOPE: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.SCOPE.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.SCOPE.label,
  id: CATEGORY_CONFIG.SCOPE.key,
};

const TAXONOMIC_LEVEL_CLASS: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_CLASS.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_CLASS.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_CLASS.key,
};

const TAXONOMIC_LEVEL_DOMAIN: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_DOMAIN.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_DOMAIN.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_DOMAIN.key,
};

const TAXONOMIC_LEVEL_FAMILY: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_FAMILY.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_FAMILY.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_FAMILY.key,
};

const TAXONOMIC_LEVEL_GENUS: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_GENUS.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_GENUS.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_GENUS.key,
};

const TAXONOMIC_LEVEL_KINGDOM: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_KINGDOM.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_KINGDOM.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_KINGDOM.key,
};

const TAXONOMIC_LEVEL_ORDER: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_ORDER.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_ORDER.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_ORDER.key,
};

const TAXONOMIC_LEVEL_PHYLUM: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_PHYLUM.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_PHYLUM.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_PHYLUM.key,
};

const TAXONOMIC_LEVEL_REALM: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_REALM.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_REALM.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_REALM.key,
};

const TAXONOMIC_LEVEL_SPECIES: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMIC_LEVEL_SPECIES.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMIC_LEVEL_SPECIES.label,
  id: CATEGORY_CONFIG.TAXONOMIC_LEVEL_SPECIES.key,
};

const TAXONOMY_ID: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.TAXONOMY_ID.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.TAXONOMY_ID.label,
  id: CATEGORY_CONFIG.TAXONOMY_ID.key,
};

const WORKFLOW_NAME: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.WORKFLOW_NAME.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.WORKFLOW_NAME.label,
  id: CATEGORY_CONFIG.WORKFLOW_NAME.key,
  sortingFn: "alphanumeric",
};

export const COLUMNS: ColumnDef<WorkflowEntity>[] = [
  WORKFLOW_NAME,
  CATEGORY,
  COMMON_NAME,
  PLOIDY,
  SCOPE,
  TAXONOMIC_LEVEL_CLASS,
  TAXONOMIC_LEVEL_DOMAIN,
  TAXONOMIC_LEVEL_FAMILY,
  TAXONOMIC_LEVEL_GENUS,
  TAXONOMIC_LEVEL_KINGDOM,
  TAXONOMIC_LEVEL_ORDER,
  TAXONOMIC_LEVEL_PHYLUM,
  TAXONOMIC_LEVEL_REALM,
  TAXONOMIC_LEVEL_SPECIES,
  TAXONOMY_ID,
];
