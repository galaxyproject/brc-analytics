import { ROUTES } from "routes/constants";
import { Props } from "../../../../../../views/WorkflowInputsView/types";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";

/**
 * Returns breadcrumbs for the workflow input view.
 * @param props - The props for the workflow input view.
 * @param props.entityId - Entity ID.
 * @param props.genome - Genome.
 * @param props.workflow - Workflow.
 * @returns Breadcrumbs for the workflow input view.
 */
export function getBreadcrumbs({
  entityId,
  genome,
  workflow,
}: Props): Breadcrumb[] {
  return [
    { path: ROUTES.GENOMES, text: "Assemblies" },
    {
      path: replaceParameters(ROUTES.GENOME, { entityId }),
      text: genome.accession,
    },
    { path: "", text: workflow.workflowName },
    { path: "", text: "Configure Inputs" },
  ];
}
