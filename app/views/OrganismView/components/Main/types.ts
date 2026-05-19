import { RowData, TableOptions } from "@tanstack/react-table";
import type { Organism } from "../../types";

export interface Props<T extends RowData> {
  entityId: string;
  organism: Organism;
  tableOptions: Pick<TableOptions<T>, "columns" | "data" | "initialState">;
}
