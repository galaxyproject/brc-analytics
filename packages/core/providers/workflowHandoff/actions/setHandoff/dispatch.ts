import { WorkflowHandoffActionKind } from "../types";
import { SetHandoffAction, SetHandoffPayload } from "./types";

/**
 * Action creator for setting handoff inputs for an entity+path cell.
 * @param payload - Payload.
 * @returns Action with payload and action type.
 */
export function setHandoff(payload: SetHandoffPayload): SetHandoffAction {
  return {
    payload,
    type: WorkflowHandoffActionKind.SetHandoff,
  };
}
