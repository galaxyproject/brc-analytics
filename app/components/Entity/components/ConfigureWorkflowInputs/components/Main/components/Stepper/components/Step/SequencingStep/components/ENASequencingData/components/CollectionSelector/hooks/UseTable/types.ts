import { Table } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";

export interface Actions {
  switchBrowseMethod: (data?: BaseReadRun[]) => void;
}
export interface UseTable {
  actions: Actions;
  table: Table<ReadRun>;
}
