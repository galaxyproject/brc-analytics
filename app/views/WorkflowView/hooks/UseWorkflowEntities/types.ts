import type { WorkflowEntityContextValue } from "@/components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/types";
import type { Organism } from "@/views/OrganismView/types";
import type { Assembly } from "@/views/WorkflowInputsView/types";

export interface UseWorkflowEntities {
  genome: Assembly | undefined;
  organism: Organism | undefined;
  workflowEntityValue: WorkflowEntityContextValue | null;
}
