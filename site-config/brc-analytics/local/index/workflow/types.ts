import {
  WorkflowEntity as BaseWorkflowEntity,
  WorkflowAssembly,
} from "../../../../../app/views/WorkflowsView/types";

export type WorkflowEntity = Omit<BaseWorkflowEntity, "assembly"> & {
  assembly: WorkflowAssembly;
};
