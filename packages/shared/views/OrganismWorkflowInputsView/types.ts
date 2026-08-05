import { type OrganismBuilder } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/SideColumn/types";

export interface Props {
  entityId: string;
  organismBuilder?: OrganismBuilder;
  trsId: string;
}
