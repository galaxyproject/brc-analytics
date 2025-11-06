import { Table } from "@tanstack/react-table";
import { ConfiguredInput } from "../../../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { getSelectedTracks } from "../../../../utils";
import { UcscTrackNode } from "../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

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
  table: Table<UcscTrackNode>,
  stepKey: string
): Partial<ConfiguredInput> {
  const value = getSelectedTracks(table);
  return { [stepKey]: value };
}
