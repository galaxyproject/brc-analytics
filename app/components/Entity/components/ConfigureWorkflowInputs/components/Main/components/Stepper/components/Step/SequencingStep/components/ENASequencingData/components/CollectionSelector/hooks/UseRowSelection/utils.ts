import { RowSelectionState } from "@tanstack/react-table";
import { ConfiguredInput } from "../../../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

/**
 * Returns the row selection state for the configured input.
 * @param configuredInput - Configured input.
 * @returns Row selection state.
 */
export function getRowSelectionState(
  configuredInput: ConfiguredInput
): RowSelectionState {
  return [
    ...(configuredInput.readRunsPaired ?? []),
    ...(configuredInput.readRunsSingle ?? []),
  ].reduce<RowSelectionState>((acc, run) => {
    if (run) acc[run.runAccession] = true;
    return acc;
  }, {});
}
