import { WorkflowHandoffState } from "@brc-analytics/core/providers/workflowHandoff/types";
import { SetHandoffPayload } from "./types";

/**
 * Reducer action to set the handoff inputs for an entity+path cell. Replaces
 * the entire entity slot — only one handoff per entity is ever in flight
 * (consume-on-apply guarantees this), so a new dispatch cleanly supersedes
 * any prior dispatch under the same entity without preserving stale paths.
 * @param state - State.
 * @param payload - Payload.
 * @returns State.
 */
export function setHandoffAction(
  state: WorkflowHandoffState,
  payload: SetHandoffPayload
): WorkflowHandoffState {
  const { entity, inputs, path } = payload;
  return {
    ...state,
    [entity]: { [path]: inputs },
  };
}
