import { useReducer } from "react";
import { INITIAL_STATE } from "../../constants";
import { workflowInputsReducer } from "../../reducer";
import { WorkflowInputsContextValue } from "../../types";

/**
 * Internal hook wiring the reducer used by `WorkflowInputsStateProvider`.
 * @returns Reducer state and dispatch.
 */
export const useWorkflowInputsReducer = (): WorkflowInputsContextValue => {
  const [state, dispatch] = useReducer(workflowInputsReducer, INITIAL_STATE);
  return { dispatch, state };
};
