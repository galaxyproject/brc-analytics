import { ColumnPreset } from "@/views/OrganismView/components/Main/types";
import { RowData, TableOptions } from "@tanstack/react-table";

export interface Props<T extends RowData> {
  columnPresets: ColumnPreset[];
  tableOptions: Pick<TableOptions<T>, "columns" | "data" | "initialState">;
}
