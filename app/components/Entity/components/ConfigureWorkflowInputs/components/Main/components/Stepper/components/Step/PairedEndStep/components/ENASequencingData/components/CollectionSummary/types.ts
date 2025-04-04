import { ReadRun } from "../../types";
import { Table } from "@tanstack/react-table";

export interface Props {
  isRunSelected: boolean;
  onClear: () => void;
  onEdit: () => void;
  table: Table<ReadRun>;
}
