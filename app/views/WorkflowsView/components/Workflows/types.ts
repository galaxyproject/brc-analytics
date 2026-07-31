import type { WorkflowEntity } from "@/views/WorkflowsView/types";
import { type Table } from "@tanstack/react-table";

export interface Props {
  table: Table<WorkflowEntity>;
}
