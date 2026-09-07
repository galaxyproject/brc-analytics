import { useWorkflowGates } from "@repo/shared/hooks/UseWorkflowGates/hook";
import { findWorkflow } from "@repo/shared/services/workflows/entities";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Gate content on the TRS ID naming a workflow the user may see: one that
 * exists in the catalog and is not held back by the demo feature flag.
 * Only the workflow's own gates apply — a TRS ID doesn't name a category, so
 * a workflow held back by its category's gate is not caught here. Renders
 * `children` for a workflow that passes and `fallback` otherwise, letting the
 * page decide how a stale, unknown or gated workflow URL is surfaced. Must be
 * rendered below EntityDataGate, which guarantees the workflows cache is loaded
 * before the lookup runs.
 * @param props - Component props.
 * @param props.children - Content to render when the workflow is available.
 * @param props.fallback - Content to render for an unknown or gated TRS ID.
 * @param props.trsId - Workflow TRS ID.
 * @returns Children when the workflow is available, fallback otherwise.
 */
export function WorkflowGate({
  children,
  fallback,
  trsId,
}: Props): JSX.Element {
  const { isWorkflowAllowed } = useWorkflowGates();
  const isAvailable =
    Boolean(findWorkflow(trsId)) && isWorkflowAllowed({ trsId });
  return <>{isAvailable ? children : fallback}</>;
}
