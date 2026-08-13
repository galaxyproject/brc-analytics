import type { Workflow } from "@repo/shared/apis/workflow";
import { type Assembly } from "@repo/shared/views/WorkflowInputsView/types";

export interface Props {
  entityId: string;
  genome: Assembly;
  workflow: Workflow;
}
