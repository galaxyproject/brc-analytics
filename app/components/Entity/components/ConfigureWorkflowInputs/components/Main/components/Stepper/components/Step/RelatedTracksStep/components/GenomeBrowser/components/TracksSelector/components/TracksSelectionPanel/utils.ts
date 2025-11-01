import { GROUP_ID_LABEL } from "./constants";
import { Row } from "@tanstack/react-table";
import { Track } from "../../hooks/UseTable/types";

/**
 * Returns the label for a group of tracks.
 * @param row - Row.
 * @returns Group label and count.
 */
export function getGroupLabel(row: Row<Track>): string {
  const groupId = row.getValue("groupId") as string;
  const count = getGroupCount(row);
  return `${GROUP_ID_LABEL[groupId] || groupId} (${count})`;
}

/**
 * Returns the count of available (selectable) tracks in a group.
 * @param row - Row.
 * @returns Count of tracks in the group.
 */
export function getGroupCount(row: Row<Track>): number {
  return row.getLeafRows().filter((r) => r.getCanSelect()).length;
}

/**
 * Returns whether a row is the last row in the group.
 * @param rows - Rows.
 * @param row - Row.
 * @param index - Current row index.
 * @returns Whether the row is the last row in the group.
 */
export function getIsLastRow(
  rows: Row<Track>[],
  row: Row<Track>,
  index: number
): boolean {
  return !row.getIsGrouped() && rows[index + 1]?.getIsGrouped();
}
