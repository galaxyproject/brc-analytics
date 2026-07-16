import type { Workflow } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";

export interface Props {
  entityId: string;
  organism: Organism;
  workflow: Workflow;
}
