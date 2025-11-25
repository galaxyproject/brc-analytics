import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { Assembly } from "../../../../../../views/WorkflowInputsView/types";

export interface Props {
  entityId: string;
  genome: Assembly;
  workflow: Workflow;
}
