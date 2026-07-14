import { INITIAL_STATE } from "@/providers/workflowHandoff/constants";
import { workflowHandoffReducer } from "@/providers/workflowHandoff/reducer";
import { WorkflowHandoffContextValue } from "@/providers/workflowHandoff/types";
import { useReducer } from "react";

/**
 * Internal hook wiring the reducer used by `WorkflowHandoffProvider`.
 * @returns Reducer state and dispatch.
 */
export const useWorkflowHandoffReducer = (): WorkflowHandoffContextValue => {
  const [state, dispatch] = useReducer(workflowHandoffReducer, INITIAL_STATE);
  return { dispatch, state };
};
