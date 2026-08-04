import { config } from "@/config/config";
import { Side as BRCSide } from "@brc/views/EntityView/assembly/components/Side/brc/side";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { Side as GA2Side } from "@ga2/views/EntityView/assembly/components/Side/ga2/side";
import { ENTITY_KEYS } from "@repo/shared/providers/workflowHandoff/constants";
import { ROUTES } from "@repo/shared/routes/constants";
import { AnalyzeWorkflowsView } from "@repo/shared/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { OrganismWorkflowInputsView } from "@repo/shared/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import { WorkflowInputsView } from "@repo/shared/views/WorkflowInputsView/workflowInputsView";
import { APP_KEYS } from "@site-config/common/constants";
import Router, { useRouter } from "next/router";
import { type JSX, useEffect } from "react";
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

  if (!trsId)
    return config().appKey === APP_KEYS.GA2 ? (
      <AnalyzeWorkflowsView SideComponent={GA2Side} entityId={entityId} />
    ) : (
      <AnalyzeWorkflowsView SideComponent={BRCSide} entityId={entityId} />
    );

  if (isOrganism)
    return <OrganismWorkflowInputsView entityId={entityId} trsId={trsId} />;

  return <WorkflowInputsView entityId={entityId} trsId={trsId} />;
};
