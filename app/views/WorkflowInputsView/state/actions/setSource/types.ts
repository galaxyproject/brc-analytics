import { SEQUENCING_SOURCE } from "../../constants";
import { SourceKey } from "../../types";
import { WorkflowInputsActionKind } from "../types";

/**
 * Payload for the SetSource action.
 */
export interface SetSourcePayload {
  accessions: string[];
  key: SourceKey;
  sequencingSource: SEQUENCING_SOURCE;
}

/**
 * Action to write a source's contribution into state.
 */
export interface SetSourceAction {
  payload: SetSourcePayload;
  type: WorkflowInputsActionKind.SetSource;
}
