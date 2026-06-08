import { clearSourceAction } from "./actions/clearSource/action";
import { setSourceAction } from "./actions/setSource/action";
import {
  WorkflowInputsAction,
  WorkflowInputsActionKind,
} from "./actions/types";
import { WorkflowInputsState } from "./types";

/**
 * Reducer for the WorkflowInputsView state. Holds per-source contributions
 * that survive navigation (e.g. the assistant's handoff to the stepper).
 * @param state - State.
 * @param action - Action.
 * @returns State.
 */
export function workflowInputsReducer(
  state: WorkflowInputsState,
  action: WorkflowInputsAction
): WorkflowInputsState {
  const { payload, type } = action;
  switch (type) {
    case WorkflowInputsActionKind.ClearSource: {
      return clearSourceAction(state, payload);
    }
    case WorkflowInputsActionKind.SetSource: {
      return setSourceAction(state, payload);
    }
    default: {
      return state;
    }
  }
}
