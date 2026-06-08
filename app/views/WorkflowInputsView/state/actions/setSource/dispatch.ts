import { WorkflowInputsActionKind } from "../types";
import { SetSourceAction, SetSourcePayload } from "./types";

/**
 * Action creator for setting a source's contribution.
 * @param payload - Payload.
 * @returns Action with payload and action type.
 */
export function setSource(payload: SetSourcePayload): SetSourceAction {
  return {
    payload,
    type: WorkflowInputsActionKind.SetSource,
  };
}
