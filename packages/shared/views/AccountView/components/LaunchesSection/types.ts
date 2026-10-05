import type { UseUserResourceReturn } from "@repo/shared/hooks/UseUserResource/types";
import type { WorkflowRunResponse } from "@repo/shared/services/api-client/types";

export interface Props {
  resource: UseUserResourceReturn<WorkflowRunResponse>;
}
