import { type AssemblyContract } from "@repo/shared/apis/types";
import { type OrganismBuilder } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/SideColumn/types";

export type Assembly = AssemblyContract;

export interface Props {
  entityId: string;
  entityListType?: string;
  organismBuilder?: OrganismBuilder;
  trsId: string;
}
