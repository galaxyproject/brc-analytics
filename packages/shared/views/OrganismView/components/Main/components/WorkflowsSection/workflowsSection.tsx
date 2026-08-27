import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack } from "@mui/material";
import { WorkflowCategory } from "@repo/shared/components/workflow/WorkflowCategory/workflowCategory";
import { useWorkflowCategoryFeatureFlags } from "@repo/shared/hooks/UseWorkflowCategoryFeatureFlags/hook";
import { ROUTES } from "@repo/shared/routes/constants";
import { EmptyState } from "@repo/shared/views/OrganismView/components/Main/components/EmptyState/emptyState";
import { StyledSectionTitle } from "@repo/shared/views/OrganismView/components/Main/main.styles";
import { filterFlagGatedWorkflowCategories } from "@repo/shared/workflow/featureFlags";
import { type JSX } from "react";
import { type Props } from "./types";

/**
 * Organism-specific workflows section for the organism page: a header and the
 * organism-scoped workflow categories (or an empty state when none exist).
 * The categories are computed at build time and arrive via props as the
 * flag-inclusive superset, so the section prerenders without the client
 * entity store; the per-user category feature flags are applied at render
 * (false on the server and during hydration, so markup stays consistent).
 * @param props - Component props.
 * @param props.entityId - Organism entity ID.
 * @param props.workflowCategories - Organism-compatible workflow categories.
 * @returns The workflows section.
 */
export const WorkflowsSection = ({
  entityId,
  workflowCategories: allWorkflowCategories,
}: Props): JSX.Element => {
  const featureFlags = useWorkflowCategoryFeatureFlags();
  const workflowCategories = filterFlagGatedWorkflowCategories(
    allWorkflowCategories,
    featureFlags
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
