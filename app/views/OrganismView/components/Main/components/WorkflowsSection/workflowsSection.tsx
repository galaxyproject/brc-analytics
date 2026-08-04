import { EmptyState } from "@/views/OrganismView/components/Main/components/EmptyState/emptyState";
import { StyledSectionTitle } from "@/views/OrganismView/components/Main/main.styles";
import { buildOrganismWorkflows } from "@/views/OrganismView/components/Main/utils";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack } from "@mui/material";
import { WorkflowCategory } from "@repo/shared/components/workflow/WorkflowCategory/workflowCategory";
import { ROUTES } from "@repo/shared/routes/constants";
import { getWorkflows } from "@repo/shared/services/workflows/entities";
import { type JSX } from "react";
import { type Props } from "./types";

/**
 * Organism-specific workflows section for the organism page: a header and the
 * organism-scoped workflow categories (or an empty state when none exist).
 * @param props - Component props.
 * @param props.entityId - Organism entity ID.
 * @param props.organism - Organism.
 * @returns The workflows section.
 */
export const WorkflowsSection = ({
  entityId,
  organism,
}: Props): JSX.Element => {
  const isAssemblyWorkflowsEnabled = useFeatureFlag("assembly-workflows");
  const workflowCategories = buildOrganismWorkflows(
    organism,
    getWorkflows(),
    isAssemblyWorkflowsEnabled
  );
  return (
    <Stack spacing={4} useFlexGap>
      <StyledSectionTitle
        component="h2"
        id="workflows"
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        Organism specific workflows
      </StyledSectionTitle>
      {workflowCategories.length === 0 ? (
        <EmptyState>
          No organism-specific workflows exist for this organism.
        </EmptyState>
      ) : (
        workflowCategories.map((workflowCategory) => (
          <WorkflowCategory
            configureRoute={ROUTES.CONFIGURE_ORGANISM_WORKFLOW}
            disabled={workflowCategory.workflows.length === 0}
            entityId={entityId}
            key={workflowCategory.category}
            workflowCategory={workflowCategory}
            workflows={workflowCategory.workflows}
          />
        ))
      )}
    </Stack>
  );
};
