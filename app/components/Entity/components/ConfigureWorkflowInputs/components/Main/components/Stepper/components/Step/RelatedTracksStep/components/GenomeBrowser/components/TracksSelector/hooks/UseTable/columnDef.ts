import { ColumnDef } from "@tanstack/react-table";
import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { Track } from "./types";
import { RowSelectOrExpand } from "app/components/Table/components/TableCell/components/RowSelectOrExpand/rowSelectOrExpand";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";

const SELECT_FILTER_FN = "arrIncludesSome";

const GROUP_ID: ColumnDef<Track> = {
  accessorKey: CATEGORY_CONFIGS.GROUP_ID.key,
  enableGrouping: true,
  filterFn: SELECT_FILTER_FN,
  header: "",
};

const LONG_LABEL: ColumnDef<Track> = {
  accessorKey: CATEGORY_CONFIGS.LONG_LABEL.key,
  filterFn: SELECT_FILTER_FN,
  header: "",
};

const ROW_SELECT_OR_EXPAND: ColumnDef<Track> = {
  cell: RowSelectOrExpand,
  enableColumnFilter: false,
  enableGrouping: false,
  enableHiding: false,
  enableSorting: false,
  enableTableDownload: false,
  header: "",
  id: COLUMN_IDENTIFIER.ROW_SELECTION,
};

export const columns: ColumnDef<Track>[] = [
  ROW_SELECT_OR_EXPAND,
  GROUP_ID,
  LONG_LABEL,
];
