import type { Organism } from "@/views/OrganismView/types";
import type { Workflow } from "@repo/shared/apis/workflow";

export interface Props {
  entityId: string;
  organism: Organism;
  workflow: Workflow;
}
