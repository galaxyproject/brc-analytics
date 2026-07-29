import { useReducer } from "react";
import { INITIAL_STATE } from "../../constants";
import { workflowHandoffReducer } from "../../reducer";
import { WorkflowHandoffContextValue } from "../../types";

/**
 * Internal hook wiring the reducer used by `WorkflowHandoffProvider`.
 * @returns Reducer state and dispatch.
 */
export const useWorkflowHandoffReducer = (): WorkflowHandoffContextValue => {
  const [state, dispatch] = useReducer(workflowHandoffReducer, INITIAL_STATE);
  return { dispatch, state };
};
