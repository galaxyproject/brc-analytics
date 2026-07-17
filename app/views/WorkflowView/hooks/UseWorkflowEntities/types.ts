import type { Assembly } from "@/views/WorkflowInputsView/types";
import type { WorkflowEntityContextValue } from "@brc-analytics/core/components/ConfigureWorkflowInputs/providers/WorkflowEntity/types";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";

export interface UseWorkflowEntities {
  genome: Assembly | undefined;
  organism: Organism | undefined;
  workflowEntityValue: WorkflowEntityContextValue | null;
}
