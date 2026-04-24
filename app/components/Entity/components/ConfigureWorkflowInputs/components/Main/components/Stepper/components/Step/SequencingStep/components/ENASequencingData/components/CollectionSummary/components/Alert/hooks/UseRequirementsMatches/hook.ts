import { Table } from "@tanstack/react-table";
import { useMemo } from "react";
import { Assembly } from "../../../../../../../../../../../../../../../../../../../views/WorkflowInputsView/types";
import { ReadRun } from "../../../../../../types";
import { UseRequirementsMatches } from "./types";
import { buildRequirementWarnings } from "./utils";

export const useRequirementsMatches = (
  table: Table<ReadRun>,
  genome?: Assembly
): UseRequirementsMatches => {
  const { getSelectedRowModel, initialState } = table;
  const { columnFilters } = initialState;
  const { rows } = getSelectedRowModel();

  const requirementsMatches = useMemo(
    () => buildRequirementWarnings(columnFilters, rows, genome),
    [columnFilters, genome, rows]
  );

  return { requirementsMatches };
};
