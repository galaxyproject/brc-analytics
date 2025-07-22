import { ReadRun } from "../../types";
import { Table } from "@tanstack/react-table";

export interface Props {
  onClear: () => void;
  onEdit: () => void;
  selectedCount: number;
  table: Table<ReadRun>;
}
