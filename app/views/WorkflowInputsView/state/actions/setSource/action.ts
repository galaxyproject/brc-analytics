import { WorkflowInputsState } from "../../types";
import { SetSourcePayload } from "./types";

/**
 * Reducer action to set a source's contribution.
 * @param state - State.
 * @param payload - Payload.
 * @returns State.
 */
export function setSourceAction(
  state: WorkflowInputsState,
  payload: SetSourcePayload
): WorkflowInputsState {
  const { accessions, key, sequencingSource } = payload;
  return {
    ...state,
    [key]: { accessions, sequencingSource },
  };
}
