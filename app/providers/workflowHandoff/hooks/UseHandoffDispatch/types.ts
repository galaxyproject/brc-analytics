import { ClearHandoffPayload } from "@/providers/workflowHandoff/actions/clearHandoff/types";
import { SetHandoffPayload } from "@/providers/workflowHandoff/actions/setHandoff/types";

/**
 * Return type for the useHandoffDispatch hook.
 */
export interface UseHandoffDispatch {
  onClearHandoff: (payload: ClearHandoffPayload) => void;
  onSetHandoff: (payload: SetHandoffPayload) => void;
}
