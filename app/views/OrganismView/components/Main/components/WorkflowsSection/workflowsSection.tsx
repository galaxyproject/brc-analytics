import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Stack } from "@mui/material";
import { JSX } from "react";
import { ROUTES } from "../../../../../../../routes/constants";
import { getWorkflows } from "../../../../../../services/workflows/entities";
import { Accordion } from "../../../../../AnalyzeWorkflowsView/components/Main/components/Accordion/accordion";
import { StyledSectionTitle } from "../../main.styles";
import { buildOrganismWorkflows } from "../../utils";
import { EmptyState } from "../EmptyState/emptyState";
import { Props } from "./types";

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
          <Accordion
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
