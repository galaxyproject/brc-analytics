import { Table } from "@tanstack/react-table";
import { Assembly as BaseAssembly } from "../../../../../../../../../../../../../../../../../views/WorkflowInputsView/types";

export interface UseTable {
  table: Table<Assembly>;
}

export type Assembly = BaseAssembly & {
  validation: {
    error?: string;
    isValid: boolean;
  };
};
