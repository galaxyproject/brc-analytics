import type { WorkflowEntity } from "@repo/shared/views/WorkflowsView/types";
import { type Row } from "@tanstack/react-table";

export interface Props {
  row: Row<WorkflowEntity>;
}
