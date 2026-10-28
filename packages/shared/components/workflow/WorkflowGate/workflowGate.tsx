import { useWorkflowGates } from "@repo/shared/hooks/UseWorkflowGates/hook";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Gate content on the TRS ID naming a workflow the user may open here: one the
 * page's listing offers (the entity's own workflow list, or the workflows
 * listing for a page with no entity), so the page and the listing agree on
 * scope, entity fit and feature-flag gating. Renders `children` for a
 * workflow that passes and `fallback` otherwise, letting the page decide how a
 * stale, unknown, incompatible or gated workflow URL is surfaced. Rendered
 * below EntityDataGate, which waits for the workflows the check reads.
 * @param props - Component props.
 * @param props.children - Content to render when the workflow is available.
 * @param props.fallback - Content to render for an unavailable TRS ID.
 * @param props.isWorkflowAvailable - The page's availability check, bound to
 * the entity it configures a workflow for, if any.
 * @param props.trsId - Workflow TRS ID.
 * @returns Children when the workflow is available, fallback otherwise.
 */
export function WorkflowGate({
  children,
  fallback,
  isWorkflowAvailable,
  trsId,
}: Props): JSX.Element {
  const workflowGates = useWorkflowGates();
  return <>{isWorkflowAvailable(trsId, workflowGates) ? children : fallback}</>;
}
