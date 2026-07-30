import { UcscTrackNode } from "@repo/shared/utils/ucsc-tracks-api/types";
import { Table } from "@tanstack/react-table";

export interface Props {
  onClear: () => void;
  onEdit: () => void;
  selectedCount: number;
  table: Table<UcscTrackNode>;
}
