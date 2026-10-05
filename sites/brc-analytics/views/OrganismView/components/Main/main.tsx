import { Stack } from "@mui/material";
import { AssembliesSection } from "@repo/shared/views/OrganismView/components/Main/components/AssembliesSection/assembliesSection";
import { WorkflowsSection } from "@repo/shared/views/OrganismView/components/Main/components/WorkflowsSection/workflowsSection";
import { type RowData } from "@tanstack/react-table";
import { type JSX } from "react";
import { PangenomeSection } from "./components/PangenomeSection/pangenomeSection";
import { type Props } from "./types";

/**
 * Main column for the organism detail page: composes the organism-scoped
 * workflows section, the assemblies section, and (when enabled and available)
 * the pangenome section.
 * @param props - Component props.
 * @param props.assembly - Assemblies section props (column presets + table options).
 * @param props.entityId - Organism entity ID.
 * @param props.pangenome - The species' pangenome bundle, when it has one.
 * @param props.workflowCategories - Organism-compatible workflow categories.
 * @returns A JSX element with the organism detail main content.
 */
export const Main = <T extends RowData>({
  assembly,
  entityId,
  pangenome,
  workflowCategories,
}: Props<T>): JSX.Element => {
  return (
    <Stack spacing={8} useFlexGap>
      <WorkflowsSection
        entityId={entityId}
        workflowCategories={workflowCategories}
      />
      <AssembliesSection {...assembly} />
      <PangenomeSection pangenome={pangenome} />
    </Stack>
  );
};
