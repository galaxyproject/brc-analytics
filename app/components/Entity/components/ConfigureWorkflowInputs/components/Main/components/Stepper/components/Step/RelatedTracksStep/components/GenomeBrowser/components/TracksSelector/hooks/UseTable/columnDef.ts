import { ColumnDef } from "@tanstack/react-table";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { Track } from "./types";
import { RowSelectOrExpand } from "../../../../../../../../../../../../../../../../Table/components/TableCell/components/RowSelectOrExpand/rowSelectOrExpand";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";

const SELECT_FILTER_FN = "arrIncludesSome";

const GROUP_ID: ColumnDef<Track> = {
  accessorKey: CATEGORY_CONFIGS.GROUP_ID.key,
  enableGrouping: true,
  filterFn: SELECT_FILTER_FN,
  header: "",
};

const ROW_SELECT_OR_EXPAND: ColumnDef<Track> = {
  cell: RowSelectOrExpand,
  enableColumnFilter: false,
  enableGrouping: false,
  header: "",
  id: COLUMN_IDENTIFIER.ROW_SELECTION,
};

const SHORT_LABEL: ColumnDef<Track> = {
  accessorKey: CATEGORY_CONFIGS.SHORT_LABEL.key,
  cell: (ctx) => ctx.getValue() || LABEL.UNSPECIFIED,
  enableGrouping: false,
  filterFn: SELECT_FILTER_FN,
  header: "",
};

export const columns: ColumnDef<Track>[] = [
  ROW_SELECT_OR_EXPAND,
  GROUP_ID,
  SHORT_LABEL,
];
