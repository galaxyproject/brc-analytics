import type { Workflow } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import type { Organism } from "../../../OrganismWorkflowsView/types";

export interface Props {
  entityId: string;
  organism: Organism;
  workflow: Workflow;
}
