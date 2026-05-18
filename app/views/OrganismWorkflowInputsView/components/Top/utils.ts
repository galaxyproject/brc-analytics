import type { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ROUTES } from "../../../../../routes/constants";
import type { Props } from "./types";

/**
 * Returns breadcrumbs for the OrganismWorkflowInputsView component.
 * @param props - Component props.
 * @param props.entityId - Entity ID.
 * @param props.organism - Organism.
 * @param props.workflow - Workflow.
 * @returns Breadcrumbs.
 */
export function getBreadcrumbs({
  entityId,
  organism,
  workflow,
}: Props): Breadcrumb[] {
  return [
    { path: ROUTES.ORGANISMS, text: "Organisms" },
    {
      path: replaceParameters(ROUTES.ORGANISM, { entityId }),
      text: organism.taxonomicLevelSpecies,
    },
    {
      path: replaceParameters(ROUTES.ORGANISM_ANALYZE_WORKFLOWS, { entityId }),
      text: "Select a Workflow",
    },
    { path: "", text: workflow.workflowName },
  ];
}
