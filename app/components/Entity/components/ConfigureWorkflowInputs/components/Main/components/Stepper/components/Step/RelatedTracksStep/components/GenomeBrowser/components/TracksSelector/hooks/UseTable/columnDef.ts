import { ColumnDef } from "@tanstack/react-table";
import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { Track } from "./types";

const SELECT_FILTER_FN = "arrIncludesSome";

const GROUP_ID: ColumnDef<Track> = {
  accessorKey: CATEGORY_CONFIGS.GROUP_ID.key,
  enableHiding: false,
  filterFn: SELECT_FILTER_FN,
  header: "",
  meta: { width: "1fr" },
};

const LONG_LABEL: ColumnDef<Track> = {
  accessorKey: CATEGORY_CONFIGS.LONG_LABEL.key,
  filterFn: SELECT_FILTER_FN,
  header: "",
  meta: { width: "1fr" },
};

export const columns: ColumnDef<Track>[] = [
  { ...COLUMN_DEF.ROW_SELECTION, header: "" } as ColumnDef<Track>,
  GROUP_ID,
  LONG_LABEL,
];
