import { DEFAULT_SOURCE_STATE } from "../../constants";
import { WorkflowInputsState } from "../../types";
import { ClearSourcePayload } from "./types";

/**
 * Reducer action to reset a source's contribution to defaults.
 * @param state - State.
 * @param payload - Payload.
 * @returns State.
 */
export function clearSourceAction(
  state: WorkflowInputsState,
  payload: ClearSourcePayload
): WorkflowInputsState {
  const { key } = payload;
  return {
    ...state,
    [key]: { ...DEFAULT_SOURCE_STATE },
  };
}
