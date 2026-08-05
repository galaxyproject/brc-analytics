import type { ColumnPreset } from "@repo/shared/views/OrganismView/components/Main/types";
import type { RowData, Table } from "@tanstack/react-table";

export interface Props<T extends RowData> {
  columnPresets: ColumnPreset[];
  table: Table<T>;
}
