import { createContext } from "react";
import { INITIAL_STATE } from "./constants";
import { WorkflowHandoffContextValue } from "./types";

/**
 * Context for the WorkflowInputsView state provider. The default `dispatch`
 * throws so a consumer rendered outside `WorkflowHandoffProvider` fails
 * loudly instead of silently no-opping its action.
 */
export const WorkflowHandoffContext =
  createContext<WorkflowHandoffContextValue>({
    dispatch: () => {
      throw new Error(
        "WorkflowHandoffContext dispatch called outside WorkflowHandoffProvider — wrap the consumer in the provider (mounted in pages/_app.tsx)."
      );
    },
    state: INITIAL_STATE,
  });
