import type { Organism } from "@brc-analytics/core/views/OrganismView/types";
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
  organism: Organism;
}
