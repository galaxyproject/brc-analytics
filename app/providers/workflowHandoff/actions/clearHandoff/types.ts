import { EntityKey } from "../../types";
import { WorkflowHandoffActionKind } from "../types";

/**
 * Action to clear the handoff payload for an entity+path cell.
 */
export interface ClearHandoffAction {
  payload: ClearHandoffPayload;
  type: WorkflowHandoffActionKind.ClearHandoff;
}

/**
 * Payload for the ClearHandoff action.
 */
export interface ClearHandoffPayload {
  entity: EntityKey;
  path: string;
}
