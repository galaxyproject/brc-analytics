import { findWorkflow } from "@repo/shared/services/workflows/entities";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Gate content on the TRS ID matching a catalog workflow. Renders `children`
 * for a known workflow and `fallback` otherwise, letting the page decide how
 * a stale or unknown workflow URL is surfaced. Must be rendered below
 * EntityDataGate, which guarantees the workflows cache is loaded before the
 * lookup runs.
 * @param props - Component props.
 * @param props.children - Content to render when the workflow exists.
 * @param props.fallback - Content to render for an unknown TRS ID.
 * @param props.trsId - Workflow TRS ID.
 * @returns Children when the workflow exists, fallback otherwise.
 */
export function WorkflowGate({
  children,
  fallback,
  trsId,
}: Props): JSX.Element {
  return <>{findWorkflow(trsId) ? children : fallback}</>;
}
