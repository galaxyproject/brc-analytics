import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import type {
  RowData,
  TableOptions,
  VisibilityState,
} from "@tanstack/react-table";

export interface ColumnPreset {
  columnVisibility: VisibilityState;
  key: string;
  label: string;
}

export interface Props<T extends RowData> {
  assembly: {
    columnPresets: ColumnPreset[];
    tableOptions: Pick<TableOptions<T>, "columns" | "data" | "initialState">;
  };
  entityId: string;
  workflowCategories: WorkflowCategory[];
}
