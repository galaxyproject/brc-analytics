import { type UcscTrackNode } from "@repo/shared/utils/ucsc-tracks-api/types";
import { type Table } from "@tanstack/react-table";

export interface Props {
  table: Table<UcscTrackNode>;
}
