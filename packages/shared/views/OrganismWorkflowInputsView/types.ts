import type { OrganismContract } from "@repo/shared/apis/types";
import { type OrganismBuilder } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/SideColumn/types";

export interface Props {
  entityId: string;
  organism: OrganismContract;
  organismBuilder?: OrganismBuilder;
  trsId: string;
}
