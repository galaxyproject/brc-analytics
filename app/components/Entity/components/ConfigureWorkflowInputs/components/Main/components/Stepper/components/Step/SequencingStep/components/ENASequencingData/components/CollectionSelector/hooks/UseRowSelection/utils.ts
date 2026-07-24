import { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { RowSelectionState } from "@tanstack/react-table";

/**
 * Returns the row selection state for the configured input.
 * @param configuredInput - Configured input.
 * @returns Row selection state.
 */
export function getRowSelectionState(
  configuredInput: ConfiguredInput
): RowSelectionState {
  const runs = [
    ...(configuredInput.readRunsPaired ?? []),
    ...(configuredInput.readRunsSingle ?? []),
  ];
  if (configuredInput.readRunPairedFile) {
    runs.push(configuredInput.readRunPairedFile);
  }
  if (configuredInput.readRunSingleFile) {
    runs.push(configuredInput.readRunSingleFile);
  }
  return runs.reduce<RowSelectionState>((acc, run) => {
    if (run) acc[run.runAccession] = true;
    return acc;
  }, {});
}
