import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { JSX } from "react";
import WORKFLOW_CATEGORIES from "../../../../../catalog/output/workflows.json";
import { ROUTES } from "../../../../../routes/constants";
import { Accordion } from "../../../AnalyzeWorkflowsView/components/Main/components/Accordion/accordion";
import type { Props } from "./types";
import { buildOrganismWorkflows } from "./utils";

/**
 * Main component for the OrganismWorkflowsView, which displays compatible organism-scoped workflows.
 * @param props - Component props.
 * @param props.entityId - Entity ID.
 * @param props.organism - Organism.
 * @returns A JSX element representing the main content of the OrganismWorkflowsView.
 */
export const Main = ({ entityId, organism }: Props): JSX.Element => {
  const workflowCategories = buildOrganismWorkflows(
    organism,
    WORKFLOW_CATEGORIES
  );
  return (
    <BackPageContentMainColumn>
      {workflowCategories.length === 0 ? (
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          There are no configured workflows for this organism.
        </Typography>
      ) : (
        workflowCategories.map((workflowCategory) => {
          return (
            <Accordion
              configureRoute={ROUTES.CONFIGURE_ORGANISM_WORKFLOW}
              disabled={workflowCategory.workflows.length === 0}
              entityId={entityId}
              key={workflowCategory.category}
              workflowCategory={workflowCategory}
              workflows={workflowCategory.workflows}
            />
          );
        })
      )}
    </BackPageContentMainColumn>
  );
};
