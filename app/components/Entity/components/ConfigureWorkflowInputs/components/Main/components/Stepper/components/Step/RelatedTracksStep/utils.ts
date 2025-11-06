import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { Table } from "@tanstack/react-table";
import { UcscTrackNode } from "../../../../../../../../../../../utils/ucsc-tracks-api/entities";

/**
 * Returns the selected tracks.
 * @param table - Table.
 * @returns Selected tracks.
 */
export function getSelectedTracks(
  table: Table<UcscTrackNode>
): string[] | null {
  const tracks = Object.keys(table.getState().rowSelection);
  return tracks.length > 0 ? tracks : null;
}

/**
 * Renders the value for the tracks step.
 * @param tracks - Tracks.
 * @returns The value for the tracks step.
 */
export function renderValue(
  tracks: string[] | null | undefined
): string | undefined {
  if (tracks === null) return LABEL.NONE;
  if (tracks === undefined) return undefined;
  if (tracks.length === 0) return "User upload to Galaxy";
  const count = tracks.length;
  if (count === 1) return "1 track";
  return `${count} tracks`;
}
