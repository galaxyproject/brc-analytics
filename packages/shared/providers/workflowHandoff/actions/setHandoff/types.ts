import { EntityKey, HandoffInputs } from "../../types";
import { WorkflowHandoffActionKind } from "../types";

/**
 * Action to write a handoff payload for an entity+path.
 */
export interface SetHandoffAction {
  payload: SetHandoffPayload;
  type: WorkflowHandoffActionKind.SetHandoff;
}

/**
 * Payload for the SetHandoff action.
 */
export interface SetHandoffPayload {
  entity: EntityKey;
  inputs: HandoffInputs;
  path: string;
}
