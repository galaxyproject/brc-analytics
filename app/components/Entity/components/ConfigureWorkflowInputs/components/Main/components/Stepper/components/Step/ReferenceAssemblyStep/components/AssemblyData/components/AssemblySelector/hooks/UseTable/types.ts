import { Table } from "@tanstack/react-table";
import { Assembly as BaseAssembly } from "../../../../../../../../../../../../../../../../../views/WorkflowInputsView/types";

export type Assembly = BaseAssembly;

export interface UseTable {
  table: Table<Assembly>;
}
