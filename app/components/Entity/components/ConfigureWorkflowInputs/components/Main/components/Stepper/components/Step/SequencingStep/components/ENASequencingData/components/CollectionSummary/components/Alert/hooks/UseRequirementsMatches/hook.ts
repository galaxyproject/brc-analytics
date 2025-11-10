import { Table } from "@tanstack/react-table";
import { ReadRun } from "../../../../../../types";
import { UseRequirementsMatches } from "./types";
import { useMemo } from "react";
import { buildRequirementsMatches } from "./utils";

export const useRequirementsMatches = (
  table: Table<ReadRun>
): UseRequirementsMatches => {
  const { getSelectedRowModel, initialState } = table;
  const { columnFilters } = initialState;
  const { rows } = getSelectedRowModel();

  const requirementsMatches = useMemo(
    () => buildRequirementsMatches(columnFilters, rows),
    [columnFilters, rows]
  );

  return { requirementsMatches };
};
