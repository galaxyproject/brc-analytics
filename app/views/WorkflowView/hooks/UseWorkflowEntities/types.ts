import type { WorkflowEntityContextValue } from "@/components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/types";
import type { Assembly } from "@/views/WorkflowInputsView/types";
import type { OrganismContract } from "@repo/shared/apis/types";

export interface UseWorkflowEntities {
  genome: Assembly | undefined;
  organism: OrganismContract | undefined;
  workflowEntityValue: WorkflowEntityContextValue | null;
}
