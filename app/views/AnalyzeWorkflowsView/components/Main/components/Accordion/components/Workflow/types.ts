import type { Workflow } from "@brc-analytics/core/apis/workflow";

export interface Props {
  configureRoute?: string;
  entityId: string;
  workflow: Workflow;
}
