import { clearHandoff as clearHandoffAction } from "@brc-analytics/core/providers/workflowHandoff/actions/clearHandoff/dispatch";
import { ClearHandoffPayload } from "@brc-analytics/core/providers/workflowHandoff/actions/clearHandoff/types";
import { setHandoff as setHandoffAction } from "@brc-analytics/core/providers/workflowHandoff/actions/setHandoff/dispatch";
import { SetHandoffPayload } from "@brc-analytics/core/providers/workflowHandoff/actions/setHandoff/types";
import { WorkflowHandoffContext } from "@brc-analytics/core/providers/workflowHandoff/context";
import { useCallback, useContext } from "react";
import { UseHandoffDispatch } from "./types";

/**
 * Hook returning handoff action dispatchers. Callers pass `entity` + `path`
 * (and `inputs` for set) per-call, so the same hook serves any entity/path
 * cell.
 * @returns Object containing action dispatch functions.
 */
export const useHandoffDispatch = (): UseHandoffDispatch => {
  const { dispatch } = useContext(WorkflowHandoffContext);

  const onClearHandoff = useCallback(
    (payload: ClearHandoffPayload) => {
      dispatch(clearHandoffAction(payload));
    },
    [dispatch]
  );

  const onSetHandoff = useCallback(
    (payload: SetHandoffPayload) => {
      dispatch(setHandoffAction(payload));
    },
    [dispatch]
  );

  return { onClearHandoff, onSetHandoff };
};
