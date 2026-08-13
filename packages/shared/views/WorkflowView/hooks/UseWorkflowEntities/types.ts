import type { OrganismContract } from "@repo/shared/apis/types";
import type { WorkflowEntityContextValue } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/types";
import type { Assembly } from "@repo/shared/views/WorkflowInputsView/types";

export interface UseWorkflowEntities {
  genome: Assembly | undefined;
  organism: OrganismContract | undefined;
  workflowEntityValue: WorkflowEntityContextValue | null;
}
