import type { RowData, Table } from "@tanstack/react-table";
import type { ColumnPreset } from "../../../types";

export interface Props<T extends RowData> {
  columnPresets: ColumnPreset[];
  table: Table<T>;
}
