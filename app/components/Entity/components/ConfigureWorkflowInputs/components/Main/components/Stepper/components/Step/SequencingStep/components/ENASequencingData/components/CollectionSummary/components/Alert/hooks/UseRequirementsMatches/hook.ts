import { Table } from "@tanstack/react-table";
import { useMemo } from "react";
import { useGenome } from "../../../../../../../../../../../../../../../providers/Genome/hook";
import { useWorkflowEntity } from "../../../../../../../../../../../../../../../providers/WorkflowEntity/hook";
import { ReadRun } from "../../../../../../types";
import type { UseRequirementsMatches } from "./types";
import { buildRequirementWarnings } from "./utils";

export const useRequirementsMatches = (
  table: Table<ReadRun>
): UseRequirementsMatches => {
  const { getSelectedRowModel, initialState } = table;
  const { columnFilters } = initialState;
  const { rows } = getSelectedRowModel();
  const { ncbiTaxonomyId, taxonomicLevelSpecies } = useWorkflowEntity() ?? {};
  const { speciesTaxonomyId } = useGenome() ?? {};

  const requirementsMatches = useMemo(
    () =>
      buildRequirementWarnings(columnFilters, rows, {
        ncbiTaxonomyId,
        speciesTaxonomyId,
        taxonomicLevelSpecies,
      }),
    [
      columnFilters,
      rows,
      ncbiTaxonomyId,
      speciesTaxonomyId,
      taxonomicLevelSpecies,
    ]
  );

  return { requirementsMatches };
};
