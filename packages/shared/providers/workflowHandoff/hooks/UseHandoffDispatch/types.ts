import { type ClearHandoffPayload } from "@repo/shared/providers/workflowHandoff/actions/clearHandoff/types";
import { type SetHandoffPayload } from "@repo/shared/providers/workflowHandoff/actions/setHandoff/types";

/**
 * Return type for the useHandoffDispatch hook.
 */
export interface UseHandoffDispatch {
  onClearHandoff: (payload: ClearHandoffPayload) => void;
  onSetHandoff: (payload: SetHandoffPayload) => void;
}
