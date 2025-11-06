import { GROUP_ID_LABEL } from "./constants";
import { Row } from "@tanstack/react-table";
import { UcscTrackNode } from "../../../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

/**
 * Returns the count of available (selectable) tracks in a group.
 * @param row - Row.
 * @returns Count of tracks in the group.
 */
export function getGroupCount(row: Row<UcscTrackNode>): number {
  return row.getLeafRows().filter((r) => r.getCanSelect()).length;
}

/**
 * Returns the label for a group of tracks.
 * @param row - Row.
 * @returns Group label and count.
 */
export function getGroupLabel(row: Row<UcscTrackNode>): string {
  const groupId = row.getValue("groupId") as string;
  const count = getGroupCount(row);
  return `${GROUP_ID_LABEL[groupId] || groupId} (${count})`;
}

/**
 * Returns whether a row is the last row in the group.
 * Returns false if the row is a grouped row.
 * Otherwise, returns true if the row is the last row in the group (i.e. next row is a grouped row).
 * @param rows - Rows.
 * @param row - Row.
 * @param index - Current row index.
 * @returns Whether the row is the last row in the group.
 */
export function getIsLastRowInGroup(
  rows: Row<UcscTrackNode>[],
  row: Row<UcscTrackNode>,
  index: number
): boolean {
  const isLastRow = index === rows.length - 1;
  // If the row is a grouped row, it is not the last row.
  if (row.getIsGrouped()) return false;

  // If the row is the last row, it is the last row.
  if (isLastRow) return true;

  // If the next row is a grouped row, it is not the last row of the current group.
  return rows[index + 1]?.getIsGrouped();
}
