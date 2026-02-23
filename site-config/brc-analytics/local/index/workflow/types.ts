import {
  Workflow,
  WorkflowCategory,
} from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";

export type WorkflowEntity = Workflow &
  Pick<WorkflowCategory, "category"> & {
    disabled?: boolean;
  };
