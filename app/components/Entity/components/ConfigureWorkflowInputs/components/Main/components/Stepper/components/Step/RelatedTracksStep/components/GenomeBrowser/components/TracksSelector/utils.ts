import { Table } from "@tanstack/react-table";
import { Track } from "./hooks/UseTable/types";
import { ConfiguredInput } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { getSelectedTracks } from "../../../../utils";

/**
 * Clears the tracks data.
 * @param stepKey - Step key.
 * @returns Partial configured input.
 */
export function clearTracksData(stepKey: string): Partial<ConfiguredInput> {
  return { [stepKey]: null };
}

/**
 * Returns the tracks data for the selected rows.
 * @param table - Table.
 * @param stepKey - Step key.
 * @returns Partial configured input.
 */
export function getTracksData(
  table: Table<Track>,
  stepKey: string
): Partial<ConfiguredInput> {
  const value = getSelectedTracks(table);
  return { [stepKey]: value };
}
