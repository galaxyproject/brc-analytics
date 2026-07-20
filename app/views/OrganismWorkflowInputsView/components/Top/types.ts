import type { Workflow } from "@brc-analytics/core/apis/workflow";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";

export interface Props {
  entityId: string;
  organism: Organism;
  workflow: Workflow;
}
