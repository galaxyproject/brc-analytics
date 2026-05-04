import { Table } from "@tanstack/react-table";
import { useMemo } from "react";
import { useGenome } from "../../../../../../../../../../../../../../../providers/Genome/hook";
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
  const { ncbiTaxonomyId, taxonomicLevelSpecies } = useWorkflowEntity() ?? {};
  const genome = useGenome();

  const requirementsMatches = useMemo(
    () =>
      ncbiTaxonomyId && taxonomicLevelSpecies
        ? buildRequirementWarnings(columnFilters, rows, {
            ncbiTaxonomyId,
            speciesTaxonomyId: genome?.speciesTaxonomyId,
            taxonomicLevelSpecies,
          })
        : [],
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
