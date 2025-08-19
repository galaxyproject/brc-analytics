import { ROUTES } from "routes/constants";
import { Props } from "../../../../../../views/WorkflowInputsView/types";
import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";

/**
 * Returns breadcrumbs for the workflow input view.
 * @param props - The props for the workflow input view.
 * @param props.entityId - Entity ID.
 * @param props.entityListType - Entity list type.
 * @param props.genome - Genome.
 * @param props.workflow - Workflow.
 * @returns Breadcrumbs for the workflow input view.
 */
export function getBreadcrumbs({
  entityId,
  entityListType,
  genome,
  workflow,
}: Props): Breadcrumb[] {
  const isOrganism = entityListType === "organisms";
  return [
    {
      path: isOrganism ? ROUTES.ORGANISMS : ROUTES.GENOMES,
      text: isOrganism ? "Organisms" : "Assemblies",
    },
    {
      path: isOrganism
        ? replaceParameters(ROUTES.PRIORITY_PATHOGEN, {
            entityId,
            entityListType: "organisms",
          })
        : replaceParameters(ROUTES.GENOME, { entityId }),
      text: genome?.accession || entityId,
    },
    { path: "", text: workflow.workflowName },
    { path: "", text: "Configure Inputs" },
  ];
}
