import { Assembly } from "@/views/WorkflowInputsView/types";
import type { Workflow } from "@repo/shared/apis/workflow";

export interface Props {
  entityId: string;
  genome: Assembly;
  workflow: Workflow;
}
