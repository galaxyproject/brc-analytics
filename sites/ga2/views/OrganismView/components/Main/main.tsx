import { Stack } from "@mui/material";
import { AssembliesSection } from "@repo/shared/views/OrganismView/components/Main/components/AssembliesSection/assembliesSection";
import { WorkflowsSection } from "@repo/shared/views/OrganismView/components/Main/components/WorkflowsSection/workflowsSection";
import { type Props } from "@repo/shared/views/OrganismView/components/Main/types";
import { type RowData } from "@tanstack/react-table";
import { type JSX } from "react";

/**
 * Main column for the organism detail page: composes the organism-scoped
 * workflows section and the assemblies section.
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
    </Stack>
  );
};
