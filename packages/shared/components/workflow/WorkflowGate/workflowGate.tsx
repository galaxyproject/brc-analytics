import { useWorkflowGates } from "@repo/shared/hooks/UseWorkflowGates/hook";
import { type JSX } from "react";
import type { Props } from "./types";
import { isWorkflowAvailable } from "./utils";

/**
 * Gate content on the TRS ID naming a workflow the user may see here: one that
 * exists in the catalog, has a scope the page accepts, and is not held
 * back by the demo feature flag, whether through its own gate or its
 * category's. Renders `children` for a workflow that passes and `fallback`
 * otherwise, letting the page decide how a stale, unknown, out-of-scope or
 * gated workflow URL is surfaced. Must be rendered below EntityDataGate, which
 * guarantees the workflows cache is loaded before the lookup runs.
 * @param props - Component props.
 * @param props.children - Content to render when the workflow is available.
 * @param props.fallback - Content to render for an unavailable TRS ID.
 * @param props.scopes - Workflow scopes the page accepts.
 * @param props.trsId - Workflow TRS ID.
 * @returns Children when the workflow is available, fallback otherwise.
 */
export function WorkflowGate({
  children,
  fallback,
  scopes,
  trsId,
}: Props): JSX.Element {
  const workflowGates = useWorkflowGates();
  const isAvailable = isWorkflowAvailable(trsId, scopes, workflowGates);
  return <>{isAvailable ? children : fallback}</>;
}
