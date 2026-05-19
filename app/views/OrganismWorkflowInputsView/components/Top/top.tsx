import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { JSX } from "react";
import type { Props } from "./types";
import { getBreadcrumbs } from "./utils";

/**
 * Top component for the OrganismWorkflowInputsView, displaying breadcrumbs and title.
 * @param props - Component props.
 * @param props.entityId - Entity ID.
 * @param props.organism - Organism.
 * @param props.workflow - Workflow.
 * @returns A JSX element representing the top section.
 */
export const Top = ({ entityId, organism, workflow }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({ entityId, organism, workflow })}
      title="Configure Inputs"
    />
  );
};
