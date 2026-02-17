import { Table } from "@tanstack/react-table";
import { WorkflowEntity } from "../../../../../site-config/brc-analytics/local/index/workflow/types";

export interface Props {
  table: Table<WorkflowEntity>;
}
