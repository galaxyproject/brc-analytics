import { createContext } from "react";
import { INITIAL_STATE } from "./constants";
import { WorkflowInputsContextValue } from "./types";

/**
 * Context for the WorkflowInputsView state provider. The default `dispatch`
 * throws so a consumer rendered outside `WorkflowInputsStateProvider` fails
 * loudly instead of silently no-opping its action.
 */
export const WorkflowInputsContext = createContext<WorkflowInputsContextValue>({
  dispatch: () => {
    throw new Error(
      "WorkflowInputsContext dispatch called outside WorkflowInputsStateProvider — wrap the consumer in the provider (mounted in pages/_app.tsx)."
    );
  },
  state: INITIAL_STATE,
});
