import type { WorkflowEntity } from "@/views/WorkflowsView/types";
import { type Row } from "@tanstack/react-table";

export interface Props {
  row: Row<WorkflowEntity>;
}
