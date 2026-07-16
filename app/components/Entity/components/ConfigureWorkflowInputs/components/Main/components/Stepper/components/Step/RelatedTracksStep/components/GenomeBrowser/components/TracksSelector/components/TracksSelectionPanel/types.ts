import { UcscTrackNode } from "@brc-analytics/core/utils/ucsc-tracks-api/entities";
import { Table } from "@tanstack/react-table";

export interface Props {
  table: Table<UcscTrackNode>;
}
