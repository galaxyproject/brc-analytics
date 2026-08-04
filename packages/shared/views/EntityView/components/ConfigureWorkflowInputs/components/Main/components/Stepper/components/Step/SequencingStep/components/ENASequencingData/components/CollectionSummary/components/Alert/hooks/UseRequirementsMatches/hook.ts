import { type ReadRun } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { useAssembly } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/Assembly/hook";
import { useWorkflowEntity } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";
import { type Table } from "@tanstack/react-table";
import { useMemo } from "react";
import type { UseRequirementsMatches } from "./types";
import { buildRequirementWarnings } from "./utils";

export const useRequirementsMatches = (
  table: Table<ReadRun>
): UseRequirementsMatches => {
  const { getSelectedRowModel, initialState } = table;
  const { columnFilters } = initialState;
  const { rows } = getSelectedRowModel();
  const { ncbiTaxonomyId, taxonomicLevelSpecies } = useWorkflowEntity() ?? {};
  const { speciesTaxonomyId } = useAssembly() ?? {};

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
