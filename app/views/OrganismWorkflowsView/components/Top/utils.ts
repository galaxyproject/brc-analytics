import type { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ROUTES } from "../../../../../routes/constants";
import type { Props } from "./types";

/**
 * Returns breadcrumbs for the OrganismWorkflowsView component.
 * @param props - Component props.
 * @param props.entityId - Entity ID.
 * @param props.organism - Organism.
 * @returns Breadcrumbs.
 */
export function getBreadcrumbs({ entityId, organism }: Props): Breadcrumb[] {
  return [
    { path: ROUTES.ORGANISMS, text: "Organisms" },
    {
      path: replaceParameters(ROUTES.ORGANISM, { entityId }),
      text: organism.taxonomicLevelSpecies,
    },
    { path: "", text: "Select a Workflow" },
  ];
}
