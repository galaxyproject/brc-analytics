import { ColumnDef } from "@tanstack/react-table";
import { CATEGORY_CONFIG } from "./categoryGroupConfig";
import { WorkflowEntity } from "./types";

const CATEGORY: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.CATEGORY.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.CATEGORY.label,
  id: CATEGORY_CONFIG.CATEGORY.key,
};

const PLOIDY: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.PLOIDY.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.PLOIDY.label,
  id: CATEGORY_CONFIG.PLOIDY.key,
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
  PLOIDY,
  TAXONOMY_ID,
];
