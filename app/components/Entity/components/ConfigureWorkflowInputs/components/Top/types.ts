import { Assembly } from "@/views/WorkflowInputsView/types";
import type { Workflow } from "@brc-analytics/core/apis/workflow";

export interface Props {
  entityId: string;
  genome: Assembly;
  workflow: Workflow;
}
