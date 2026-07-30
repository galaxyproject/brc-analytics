import { UcscTrackNode } from "@repo/shared/utils/ucsc-tracks-api/types";
import { Table } from "@tanstack/react-table";

export interface Props {
  table: Table<UcscTrackNode>;
}
