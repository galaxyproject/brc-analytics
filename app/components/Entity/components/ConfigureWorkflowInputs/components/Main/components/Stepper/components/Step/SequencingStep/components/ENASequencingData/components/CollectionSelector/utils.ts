import { RowSelectionState } from "@tanstack/react-table";
import { Table } from "@tanstack/react-table";
import { ReadRun } from "../../types";
import { ENA_QUERY_METHOD } from "../../../../types";
import { TableMeta } from "./hooks/UseTable/types";

/**
 * Resets the column filters if the ENA query method is accession and no rows are selected.
 * @param table - Table.
 * @param rowSelection - Row selection state.
 */
export function resetColumnFilters(
  table: Table<ReadRun>,
  rowSelection: RowSelectionState
): void {
  const { options } = table;
  const { meta } = options || {};
  const { enaQueryMethod } = (meta || {}) as TableMeta;

  if (enaQueryMethod !== ENA_QUERY_METHOD.ACCESSION) return;
  if (Object.keys(rowSelection).length > 0) return;

  table.resetColumnFilters();
}
