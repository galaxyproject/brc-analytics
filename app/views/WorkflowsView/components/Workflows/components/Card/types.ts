import type { WorkflowEntity } from "@/views/WorkflowsView/types";
import { Row } from "@tanstack/react-table";

export interface Props {
  row: Row<WorkflowEntity>;
}
