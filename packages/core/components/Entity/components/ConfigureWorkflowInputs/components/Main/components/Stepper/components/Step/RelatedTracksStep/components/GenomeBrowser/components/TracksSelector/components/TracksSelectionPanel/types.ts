import { UcscTrackNode } from "@brc-analytics/core/utils/ucsc-tracks-api/types";
import { Table } from "@tanstack/react-table";

export interface Props {
  table: Table<UcscTrackNode>;
}
