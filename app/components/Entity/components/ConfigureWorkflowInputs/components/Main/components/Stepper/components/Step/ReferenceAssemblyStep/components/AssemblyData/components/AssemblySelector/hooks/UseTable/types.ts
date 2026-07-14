import { Assembly as BaseAssembly } from "@/views/WorkflowInputsView/types";
import { Table } from "@tanstack/react-table";

export type Assembly = BaseAssembly;

export interface UseTable {
  table: Table<Assembly>;
}
