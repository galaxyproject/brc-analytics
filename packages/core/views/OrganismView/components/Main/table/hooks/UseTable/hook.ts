import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import {
  getCoreRowModel,
  getSortedRowModel,
  RowData,
  Table,
  TableOptions,
  useReactTable,
} from "@tanstack/react-table";

export const useTable = <T extends RowData>(
  tableOptions: Pick<TableOptions<T>, "columns" | "data" | "initialState">
): Table<T> => {
  return useReactTable({
    _features: [ROW_POSITION, ROW_PREVIEW],
    enableRowPosition: false,
    enableSorting: true,
    enableSortingInteraction: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...tableOptions,
  });
};
