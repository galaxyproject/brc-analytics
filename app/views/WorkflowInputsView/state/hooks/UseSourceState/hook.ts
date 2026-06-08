import { useContext } from "react";
import { DEFAULT_SOURCE_STATE } from "../../constants";
import { WorkflowInputsContext } from "../../context";
import { SourceKey } from "../../types";
import { UseSourceState } from "./types";

/**
 * Read a source's current contribution from WorkflowInputsView state.
 * @param key - Source key.
 * @returns Source contribution.
 */
export const useSourceState = (key: SourceKey): UseSourceState => {
  const { state } = useContext(WorkflowInputsContext);
  return state[key] ?? DEFAULT_SOURCE_STATE;
};
