import { RowSelectionState } from "@tanstack/react-table";
import { useMemo } from "react";
import { ConfiguredInput } from "../../../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { getRowSelectionState } from "./utils";

/**
 * Returns the row selection state for the configured input.
 * @param configuredInput - Configured input.
 * @returns Row selection state.
 */
export const useRowSelection = (
  configuredInput: ConfiguredInput
): RowSelectionState => {
  return useMemo(
    () => getRowSelectionState(configuredInput),
    [configuredInput]
  );
};
