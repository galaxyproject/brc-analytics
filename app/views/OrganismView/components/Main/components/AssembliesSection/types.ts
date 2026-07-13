import { RowData, TableOptions } from "@tanstack/react-table";
import { ColumnPreset } from "../../types";

export interface Props<T extends RowData> {
  columnPresets: ColumnPreset[];
  tableOptions: Pick<TableOptions<T>, "columns" | "data" | "initialState">;
}
