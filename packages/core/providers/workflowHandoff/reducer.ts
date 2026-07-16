import { clearHandoffAction } from "./actions/clearHandoff/action";
import { setHandoffAction } from "./actions/setHandoff/action";
import {
  WorkflowHandoffAction,
  WorkflowHandoffActionKind,
} from "./actions/types";
import { WorkflowHandoffState } from "./types";

/**
 * Reducer for the WorkflowInputsView state. Holds per-entity, per-path
 * handoff payloads (currently the assistant's pre-configured inputs for an
 * assembly workflow page).
 * @param state - State.
 * @param action - Action.
 * @returns State.
 */
export function workflowHandoffReducer(
  state: WorkflowHandoffState,
  action: WorkflowHandoffAction
): WorkflowHandoffState {
  const { payload, type } = action;
  switch (type) {
    case WorkflowHandoffActionKind.ClearHandoff: {
      return clearHandoffAction(state, payload);
    }
    case WorkflowHandoffActionKind.SetHandoff: {
      return setHandoffAction(state, payload);
    }
    default: {
      return state;
    }
  }
}
