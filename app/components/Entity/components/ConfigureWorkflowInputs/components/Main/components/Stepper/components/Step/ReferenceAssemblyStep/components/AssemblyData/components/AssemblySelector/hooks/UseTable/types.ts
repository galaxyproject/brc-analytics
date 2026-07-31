import { type Assembly as BaseAssembly } from "@/views/WorkflowInputsView/types";
import { type Table } from "@tanstack/react-table";

export type Assembly = BaseAssembly;

export interface UseTable {
  table: Table<Assembly>;
}
