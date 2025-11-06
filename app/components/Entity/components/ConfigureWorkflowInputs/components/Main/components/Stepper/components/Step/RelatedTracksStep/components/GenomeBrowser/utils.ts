import { Table } from "@tanstack/react-table";
import { UcscTrackNode } from "../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

/**
 * Returns the number of selected tracks.
 * @param table - Table.
 * @returns Number of selected tracks.
 */
export function getSelectedTracksCount(table: Table<UcscTrackNode>): number {
  return Object.values(table.getState().rowSelection).length;
}

/**
 * Returns the number of tracks in the table.
 * The rows are filtered to exclude grouped rows and rows that cannot be selected.
 * @param table - Table.
 * @returns Number of tracks.
 */
export function getTracksCount(table: Table<UcscTrackNode>): number {
  return table
    .getCoreRowModel()
    .flatRows.filter((r) => r.getCanSelect() && !r.getIsGrouped()).length;
}
