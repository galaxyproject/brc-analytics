import { ENA_QUERY_METHOD } from "../../../../../../types";
import { ColumnFiltersTableMeta } from "@databiosphere/findable-ui/lib/components/Filter/components/adapters/tanstack/ColumnFiltersAdapter/types";
import { ReadRun } from "../../../../types";

export interface TableMeta extends ColumnFiltersTableMeta<ReadRun> {
  enaQueryMethod: ENA_QUERY_METHOD;
}
