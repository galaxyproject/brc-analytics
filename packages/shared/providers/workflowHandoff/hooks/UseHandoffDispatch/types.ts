import { ClearHandoffPayload } from "../../actions/clearHandoff/types";
import { SetHandoffPayload } from "../../actions/setHandoff/types";

/**
 * Return type for the useHandoffDispatch hook.
 */
export interface UseHandoffDispatch {
  onClearHandoff: (payload: ClearHandoffPayload) => void;
  onSetHandoff: (payload: SetHandoffPayload) => void;
}
