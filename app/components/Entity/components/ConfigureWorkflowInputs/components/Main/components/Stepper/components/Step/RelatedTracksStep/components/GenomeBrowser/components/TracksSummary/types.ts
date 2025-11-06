import { Table } from "@tanstack/react-table";
import { UcscTrackNode } from "../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export interface Props {
  onClear: () => void;
  onEdit: () => void;
  selectedCount: number;
  table: Table<UcscTrackNode>;
}
