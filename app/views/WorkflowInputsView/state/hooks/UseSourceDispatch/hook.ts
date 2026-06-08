import { useCallback, useContext } from "react";
import { clearSource as clearSourceAction } from "../../actions/clearSource/dispatch";
import { setSource as setSourceAction } from "../../actions/setSource/dispatch";
import { WorkflowInputsContext } from "../../context";
import { SourceKey } from "../../types";
import { SetSourceInput, UseSourceDispatch } from "./types";

/**
 * Hook returning action dispatchers scoped to a single source key.
 * @param key - Source key.
 * @returns Object containing action dispatch functions.
 */
export const useSourceDispatch = (key: SourceKey): UseSourceDispatch => {
  const { dispatch } = useContext(WorkflowInputsContext);

  const onClearSource = useCallback(() => {
    dispatch(clearSourceAction({ key }));
  }, [dispatch, key]);

  const onSetSource = useCallback(
    (input: SetSourceInput) => {
      dispatch(setSourceAction({ ...input, key }));
    },
    [dispatch, key]
  );

  return { onClearSource, onSetSource };
};
