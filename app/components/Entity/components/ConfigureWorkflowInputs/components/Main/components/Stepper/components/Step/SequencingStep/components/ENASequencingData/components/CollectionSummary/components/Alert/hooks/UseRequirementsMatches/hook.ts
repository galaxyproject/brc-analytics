import { Table } from "@tanstack/react-table";
import { ReadRun } from "../../../../../../types";
import { UseRequirementsMatches } from "./types";
import { useMemo } from "react";
import { buildRequirementsMatches } from "./utils";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../../../../../../../../../../../../../../../../apis/catalog/ga2/entities";

export const useRequirementsMatches = (
  table: Table<ReadRun>,
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): UseRequirementsMatches => {
  const { getSelectedRowModel, initialState } = table;
  const { columnFilters } = initialState;
  const { rows } = getSelectedRowModel();

  const requirementsMatches = useMemo(
    () => buildRequirementsMatches(columnFilters, rows, genome),
    [columnFilters, genome, rows]
  );

  return { requirementsMatches };
};
