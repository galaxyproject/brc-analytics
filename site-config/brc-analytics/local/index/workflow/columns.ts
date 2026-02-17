import { ColumnDef } from "@tanstack/react-table";
import { CATEGORY_CONFIG } from "./categoryGroupConfig";
import { WorkflowEntity } from "./types";

const CATEGORY: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.CATEGORY.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.CATEGORY.label,
  id: CATEGORY_CONFIG.CATEGORY.key,
};

const WORKFLOW_NAME: ColumnDef<WorkflowEntity> = {
  accessorKey: CATEGORY_CONFIG.WORKFLOW_NAME.key,
  filterFn: "arrIncludesSome",
  header: CATEGORY_CONFIG.WORKFLOW_NAME.label,
  id: CATEGORY_CONFIG.WORKFLOW_NAME.key,
  sortingFn: "alphanumeric",
};

export const COLUMNS: ColumnDef<WorkflowEntity>[] = [WORKFLOW_NAME, CATEGORY];
