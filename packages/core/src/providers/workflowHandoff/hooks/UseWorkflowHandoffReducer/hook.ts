import { INITIAL_STATE } from "@brc-analytics/core/providers/workflowHandoff/constants";
import { workflowHandoffReducer } from "@brc-analytics/core/providers/workflowHandoff/reducer";
import { WorkflowHandoffContextValue } from "@brc-analytics/core/providers/workflowHandoff/types";
import { useReducer } from "react";

/**
 * Internal hook wiring the reducer used by `WorkflowHandoffProvider`.
 * @returns Reducer state and dispatch.
 */
export const useWorkflowHandoffReducer = (): WorkflowHandoffContextValue => {
  const [state, dispatch] = useReducer(workflowHandoffReducer, INITIAL_STATE);
  return { dispatch, state };
};
