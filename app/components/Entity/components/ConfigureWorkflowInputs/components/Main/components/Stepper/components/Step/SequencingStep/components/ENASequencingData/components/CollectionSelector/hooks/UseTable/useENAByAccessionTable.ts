import { InitialTableState, Table, useReactTable } from "@tanstack/react-table";
import { BaseReadRun, ReadRun } from "../../../../types";
import { useMemo } from "react";
import { UseENADataByAccession } from "../../../../hooks/UseENADataByAccession/types";
import { ENA_QUERY_METHOD } from "../../../../../../types";
import { SORTING } from "./constants";
import { CATEGORY_GROUPS } from "./categoryGroups";
import { FILTER_SORT } from "@databiosphere/findable-ui/lib/common/filters/sort/config/types";
import { mapReadRuns, sanitizeReadRuns } from "./dataTransforms";
import { TABLE_OPTIONS } from "./tableOptions";

export const useENAByAccessionTable = (
  enaQueryMethod: ENA_QUERY_METHOD,
  enaAccession: UseENADataByAccession<BaseReadRun>
): Table<ReadRun> => {
  const { data: readRuns } = enaAccession;

  const data = useMemo(
    () => sanitizeReadRuns(mapReadRuns(readRuns)),
    [readRuns]
  );

  const initialState: InitialTableState = { sorting: SORTING };

  const meta = {
    categoryGroups: CATEGORY_GROUPS,
    enaQueryMethod,
    filterSort: FILTER_SORT.COUNT,
  };

  return useReactTable<ReadRun>({
    ...TABLE_OPTIONS,
    data,
    initialState,
    meta,
  });
};
