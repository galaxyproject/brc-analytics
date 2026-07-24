import {
  WorkflowEntity as BaseWorkflowEntity,
  WorkflowAssembly,
} from "@/views/WorkflowsView/types";

export type WorkflowEntity = Omit<BaseWorkflowEntity, "assembly"> & {
  assembly: WorkflowAssembly;
};
