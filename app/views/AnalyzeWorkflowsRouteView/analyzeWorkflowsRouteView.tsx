import { ENTITY_KEYS } from "@/providers/workflowHandoff/constants";
import { AnalyzeWorkflowsView } from "@/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { OrganismWorkflowInputsView } from "@/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import { WorkflowInputsView } from "@/views/WorkflowInputsView/workflowInputsView";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ROUTES } from "@repo/shared/routes/constants";
import Router, { useRouter } from "next/router";
import { JSX, useEffect } from "react";
import type { Props } from "./types";

/**
 * Analyze workflows route view. Renders the compatible-workflows list, or — when
 * a workflow is selected via the `trsId` query param — the configure inputs view
 * for that workflow. Organism URLs without a `trsId` redirect to the organism
 * detail page, where organism workflows are listed.
 * @param props - Props.
 * @param props.entityId - Entity ID.
 * @param props.entityListType - Entity list type.
 * @returns analyze workflows content, gated on the entity store being loaded.
 */
export const AnalyzeWorkflowsRouteView = ({
  entityId,
  entityListType,
}: Props): JSX.Element => {
  const { isReady, query } = useRouter();
  // An empty `?trsId=` is treated as missing (falls back to the list / redirect).
  const trsId =
    typeof query.trsId === "string" && query.trsId ? query.trsId : undefined;
  const isOrganism = entityListType === ENTITY_KEYS.ORGANISMS;
  const shouldRedirect = isReady && isOrganism && !trsId;

  useEffect(() => {
    if (shouldRedirect) {
      Router.replace(replaceParameters(ROUTES.ORGANISM, { entityId }));
    }
  }, [entityId, shouldRedirect]);

  if (!isReady) return <></>;

  if (shouldRedirect) return <></>;

  if (!trsId) return <AnalyzeWorkflowsView entityId={entityId} />;

  if (isOrganism)
    return <OrganismWorkflowInputsView entityId={entityId} trsId={trsId} />;

  return <WorkflowInputsView entityId={entityId} trsId={trsId} />;
};
