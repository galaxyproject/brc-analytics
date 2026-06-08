import { SourceKey } from "../../types";
import { WorkflowInputsActionKind } from "../types";

/**
 * Payload for the ClearSource action.
 */
export interface ClearSourcePayload {
  key: SourceKey;
}

/**
 * Action to clear a source's contribution.
 */
export interface ClearSourceAction {
  payload: ClearSourcePayload;
  type: WorkflowInputsActionKind.ClearSource;
}
