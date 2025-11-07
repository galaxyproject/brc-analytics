import { ENA_QUERY_METHOD } from "../../../../../../types";
import { ColumnFiltersTableMeta } from "@databiosphere/findable-ui/lib/components/Filter/components/adapters/tanstack/ColumnFiltersAdapter/types";
import { Table } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";

export interface Actions {
  switchToAccession: (data: BaseReadRun[]) => void;
}
export interface TableMeta extends ColumnFiltersTableMeta<ReadRun> {
  enaQueryMethod: ENA_QUERY_METHOD;
}

export interface UseTable {
  actions: Actions;
  table: Table<ReadRun>;
}
