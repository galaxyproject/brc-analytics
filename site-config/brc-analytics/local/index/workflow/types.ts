import {
  type WorkflowEntity as BaseWorkflowEntity,
  type WorkflowAssembly,
} from "@repo/shared/views/WorkflowsView/types";

export type WorkflowEntity = Omit<BaseWorkflowEntity, "assembly"> & {
  assembly: WorkflowAssembly;
};
