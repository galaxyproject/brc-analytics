import { INITIAL_STATE } from "@repo/shared/providers/workflowHandoff/constants";
import { workflowHandoffReducer } from "@repo/shared/providers/workflowHandoff/reducer";
import { type WorkflowHandoffContextValue } from "@repo/shared/providers/workflowHandoff/types";
import { useReducer } from "react";

/**
 * Internal hook wiring the reducer used by `WorkflowHandoffProvider`.
 * @returns Reducer state and dispatch.
 */
export const useWorkflowHandoffReducer = (): WorkflowHandoffContextValue => {
  const [state, dispatch] = useReducer(workflowHandoffReducer, INITIAL_STATE);
  return { dispatch, state };
};
