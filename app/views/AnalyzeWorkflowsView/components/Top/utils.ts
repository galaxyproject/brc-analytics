import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ROUTES } from "../../../../../routes/constants";
import { Props } from "./types";

/**
 * Returns breadcrumbs for the AnalyzeWorkflowsView component.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @param props.entityId - Entity ID.
 * @returns Breadcrumbs.
 */
export function getBreadcrumbs({ assembly, entityId }: Props): Breadcrumb[] {
  return [
    { path: ROUTES.GENOMES, text: "Assemblies" },
    { path: "", text: assembly.accession },
    {
      path: replaceParameters(ROUTES.GENOME, { entityId }),
      text: "Analyze in Galaxy",
    },
    { path: "", text: "Select a Workflow" },
  ];
}
