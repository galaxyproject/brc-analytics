import { Table } from "@tanstack/react-table";
import { useContext, useMemo } from "react";
import { GenomeContext } from "../../../../../../../../../../../../../../../providers/Genome/context";
import { useWorkflowEntity } from "../../../../../../../../../../../../../../../providers/WorkflowEntity/hook";
import { ReadRun } from "../../../../../../types";
import { UseRequirementsMatches } from "./types";
import { buildRequirementWarnings } from "./utils";

export const useRequirementsMatches = (
  table: Table<ReadRun>
): UseRequirementsMatches => {
  const { getSelectedRowModel, initialState } = table;
  const { columnFilters } = initialState;
  const { rows } = getSelectedRowModel();
  const { ncbiTaxonomyId, taxonomicLevelSpecies } = useWorkflowEntity();
  const genome = useContext(GenomeContext);

  const requirementsMatches = useMemo(
    () =>
      buildRequirementWarnings(columnFilters, rows, {
        ncbiTaxonomyId,
        speciesTaxonomyId: genome?.speciesTaxonomyId,
        taxonomicLevelSpecies,
      }),
    [
      columnFilters,
      genome?.speciesTaxonomyId,
      ncbiTaxonomyId,
      rows,
      taxonomicLevelSpecies,
    ]
  );

  return { requirementsMatches };
};
