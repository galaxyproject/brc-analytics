import { AssembliesSection } from "@brc-analytics/core/views/OrganismView/components/Main/components/AssembliesSection/assembliesSection";
import type { Props } from "@brc-analytics/core/views/OrganismView/components/Main/types";
import { Stack } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import { PangenomeSection } from "./components/PangenomeSection/pangenomeSection";
import { WorkflowsSection } from "./components/WorkflowsSection/workflowsSection";

/**
 * Main column for the organism detail page: composes the organism-scoped
 * workflows section, the assemblies section, and (when enabled and available)
 * the pangenome section.
 * @param props - Component props.
 * @param props.assembly - Assemblies section props (column presets + table options).
 * @param props.entityId - Organism entity ID.
 * @param props.organism - Organism.
 * @returns A JSX element with the organism detail main content.
 */
export const Main = <T extends RowData>({
  assembly,
  entityId,
  organism,
}: Props<T>): JSX.Element => {
  return (
    <Stack spacing={8} useFlexGap>
      <WorkflowsSection entityId={entityId} organism={organism} />
      <AssembliesSection {...assembly} />
      <PangenomeSection organism={organism} />
    </Stack>
  );
};
