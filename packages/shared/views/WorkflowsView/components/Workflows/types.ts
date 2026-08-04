import type { WorkflowEntity } from "@repo/shared/views/WorkflowsView/types";
import { type Table } from "@tanstack/react-table";

export interface Props {
  table: Table<WorkflowEntity>;
}
