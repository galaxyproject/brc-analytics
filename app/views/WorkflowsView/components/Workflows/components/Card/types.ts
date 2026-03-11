import { Row } from "@tanstack/react-table";
import type { WorkflowEntity } from "../../../../../../../site-config/brc-analytics/local/index/workflow/types";

export interface Props {
  row: Row<WorkflowEntity>;
}
