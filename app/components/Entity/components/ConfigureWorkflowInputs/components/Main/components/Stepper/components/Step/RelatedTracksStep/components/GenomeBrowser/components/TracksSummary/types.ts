import { UcscTrackNode } from "@brc-analytics/core/utils/ucsc-tracks-api/entities";
import { Table } from "@tanstack/react-table";

export interface Props {
  onClear: () => void;
  onEdit: () => void;
  selectedCount: number;
  table: Table<UcscTrackNode>;
}
