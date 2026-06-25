import type { WorkflowEntityContextValue } from "../../../../components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/types";
import type { Organism } from "../../../OrganismView/types";
import type { Assembly } from "../../../WorkflowInputsView/types";

export interface UseWorkflowEntities {
  genome: Assembly | undefined;
  organism: Organism | undefined;
  workflowEntityValue: WorkflowEntityContextValue | null;
}
