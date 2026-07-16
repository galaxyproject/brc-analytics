import type { ColumnPreset } from "@brc-analytics/core/views/OrganismView/components/Main/types";
import type { RowData, Table } from "@tanstack/react-table";

export interface Props<T extends RowData> {
  presets: ColumnPreset[];
  table: Table<T>;
}
