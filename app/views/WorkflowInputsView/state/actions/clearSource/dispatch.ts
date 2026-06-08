import { WorkflowInputsActionKind } from "../types";
import { ClearSourceAction, ClearSourcePayload } from "./types";

/**
 * Action creator for clearing a source's contribution.
 * @param payload - Payload.
 * @returns Action with payload and action type.
 */
export function clearSource(payload: ClearSourcePayload): ClearSourceAction {
  return {
    payload,
    type: WorkflowInputsActionKind.ClearSource,
  };
}
