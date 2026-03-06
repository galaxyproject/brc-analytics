import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { getFacetedUniqueValuesWithArrayValues } from "@databiosphere/findable-ui/lib/components/Table/common/utils";
import { getFacetedMinMaxValues } from "@databiosphere/findable-ui/lib/components/Table/featureOptions/facetedColumn/getFacetedMinMaxValues";
import { arrIncludesSome } from "@databiosphere/findable-ui/lib/components/Table/columnDef/columnFilters/filterFn";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import {
  Table,
  useReactTable,
  getFacetedRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import type { Props } from "../../types";

/**
 * React hook to create and configure a table instance using TanStack Table.
 * @param props - Props.
 * @returns Table.
 */
export const useTable = <T>(
  props: Omit<Props<T>, "Component">
): { table: Table<T> } => {
  const { data } = props;
  const { entityConfig } = useConfig();
  const { categoryGroupConfig, getId: getRowId, list } = entityConfig;
  const { categoryGroups } = categoryGroupConfig || {};
  const { columns, tableOptions } = list; // `columns` should be of type ColumnDef<T>[].

  if (!categoryGroups) throw new Error("Category groups not configured");

  const meta = {
    categoryGroups,
    filterSort: FILTER_SORT.COUNT,
  };

  const table = useReactTable<T>({
    _features: [],
    columns,
    data,
    enableColumnFilters: true,
    enableFilters: true,
    enableMultiSort: true,
    enableSorting: true,
    filterFns: { arrIncludesSome },
    getCoreRowModel: getCoreRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValuesWithArrayValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    meta,
    ...tableOptions,
  });

  return { table };
};
