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
  const workflowEntity = useWorkflowEntity();
  const genome = useContext(GenomeContext);

  const requirementsMatches = useMemo(
    () =>
      workflowEntity
        ? buildRequirementWarnings(columnFilters, rows, {
            ncbiTaxonomyId: workflowEntity.ncbiTaxonomyId,
            speciesTaxonomyId: genome?.speciesTaxonomyId,
            taxonomicLevelSpecies: workflowEntity.taxonomicLevelSpecies,
          })
        : [],
    [columnFilters, genome?.speciesTaxonomyId, rows, workflowEntity]
  );

  return { requirementsMatches };
};
