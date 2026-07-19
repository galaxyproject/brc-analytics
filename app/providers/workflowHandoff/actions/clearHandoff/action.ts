import { WorkflowHandoffState } from "@/providers/workflowHandoff/types";
import { ClearHandoffPayload } from "./types";

/**
 * Reducer action to remove the handoff payload for an entity+path cell.
 * Drops the path entry; preserves other paths under the same entity.
 * @param state - State.
 * @param payload - Payload.
 * @returns State.
 */
export function clearHandoffAction(
  state: WorkflowHandoffState,
  payload: ClearHandoffPayload
): WorkflowHandoffState {
  const { entity, path } = payload;
  const entityPaths = state[entity];

  if (!entityPaths || !(path in entityPaths)) return state;

  // eslint-disable-next-line sonarjs/no-unused-vars -- destructured to omit `path` from `rest`
  const { [path]: _removed, ...otherEntityPaths } = entityPaths;

  return {
    ...state,
    [entity]: otherEntityPaths,
  };
}
