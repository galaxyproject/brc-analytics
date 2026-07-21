import type { Workflow } from "@repo/shared/apis/workflow";

export interface Props {
  configureRoute?: string;
  entityId: string;
  workflow: Workflow;
}
