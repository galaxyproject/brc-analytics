import { WorkflowHandoffActionKind } from "../types";
import { ClearHandoffAction, ClearHandoffPayload } from "./types";

/**
 * Action creator for clearing a handoff payload.
 * @param payload - Payload.
 * @returns Action with payload and action type.
 */
export function clearHandoff(payload: ClearHandoffPayload): ClearHandoffAction {
  return {
    payload,
    type: WorkflowHandoffActionKind.ClearHandoff,
  };
}
