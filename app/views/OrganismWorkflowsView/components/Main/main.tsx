import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
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
      {workflowCategories.map((workflowCategory) => {
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
      })}
    </BackPageContentMainColumn>
  );
};
