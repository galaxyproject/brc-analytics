import { useWorkflowGates } from "@repo/shared/hooks/UseWorkflowGates/hook";
import { type JSX, useMemo } from "react";
import type { Props } from "./types";

/**
 * Gate content on the TRS ID naming a workflow the user may open here: one the
 * page's listing offers (the entity's own workflow list, or the workflows
 * listing for a page with no entity), so the page and the listing agree on
 * scope, entity fit and feature-flag gating. Renders `children` for a
 * workflow that passes and `fallback` otherwise, letting the page decide how a
 * stale, unknown, incompatible or gated workflow URL is surfaced. Rendered
 * below EntityDataGate, which loads the workflows and entities the check reads.
 * @param props - Component props.
 * @param props.children - Content to render when the workflow is available.
 * @param props.entityId - ID of the entity the page configures a workflow for; absent on a page with no entity.
 * @param props.fallback - Content to render for an unavailable TRS ID.
 * @param props.isWorkflowAvailable - The page's availability check.
 * @param props.trsId - Workflow TRS ID.
 * @returns Children when the workflow is available, fallback otherwise.
 */
export function WorkflowGate({
  children,
  entityId,
  fallback,
  isWorkflowAvailable,
  trsId,
}: Props): JSX.Element {
  const workflowGates = useWorkflowGates();
  const isAvailable = useMemo(
    () =>
      entityId === undefined
        ? isWorkflowAvailable(trsId, workflowGates)
        : isWorkflowAvailable(trsId, workflowGates, entityId),
    [entityId, isWorkflowAvailable, trsId, workflowGates]
  );
  return <>{isAvailable ? children : fallback}</>;
}
