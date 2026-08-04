import { type ColumnPreset } from "@repo/shared/views/OrganismView/components/Main/types";
import { type RowData, type TableOptions } from "@tanstack/react-table";

export interface Props<T extends RowData> {
  columnPresets: ColumnPreset[];
  tableOptions: Pick<TableOptions<T>, "columns" | "data" | "initialState">;
}
