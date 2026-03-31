import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { JSX } from "react";
import { Props } from "./types";
import { getBreadcrumbs } from "./utils";

/**
 * Top component for the AnalyzeWorkflowsView, displaying the page title and breadcrumbs.
 * @param props - Component props.
 * @param props.assembly - Assembly entity.
 * @param props.entityId - Entity ID
 * @returns A JSX element representing the top section of the AnalyzeWorkflowsView.
 */
export const Top = ({ assembly, entityId }: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({ assembly, entityId })}
      title="Select a Workflow"
    />
  );
};
