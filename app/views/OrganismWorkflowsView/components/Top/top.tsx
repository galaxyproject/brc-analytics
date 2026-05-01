import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { JSX } from "react";
import type { Props } from "./types";
import { getBreadcrumbs } from "./utils";

/**
 * Top component for the OrganismWorkflowsView, displaying the page title and breadcrumbs.
 * @param props - Component props.
 * @param props.entityId - Entity ID.
 * @param props.organism - Organism entity.
 * @returns A JSX element representing the top section of the OrganismWorkflowsView.
 */
export const Top = ({ entityId, organism }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({ entityId, organism })}
      title="Select a Workflow"
    />
  );
};
