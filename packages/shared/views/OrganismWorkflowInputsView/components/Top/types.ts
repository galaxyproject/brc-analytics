import type { OrganismContract } from "@repo/shared/apis/types";
import type { Workflow } from "@repo/shared/apis/workflow";

export interface Props {
  entityId: string;
  organism: OrganismContract;
  workflow: Workflow;
}
