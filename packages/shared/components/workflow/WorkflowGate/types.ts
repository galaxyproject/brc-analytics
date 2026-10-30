import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { type ReactNode } from "react";

export interface Props {
  children: ReactNode;
  fallback: ReactNode;
  isWorkflowAvailable: WorkflowAvailability;
  trsId: string;
}

/**
 * Determines whether a workflow is one an entity's listing offers.
 */
export type EntityWorkflowListing<T> = (
  workflow: Workflow,
  entity: T,
  allWorkflowCategories: WorkflowCategory[],
  workflowGates: WorkflowGates
) => boolean;

/**
 * Determines whether the TRS ID from a URL names a workflow the page may open.
 */
export type WorkflowAvailability = (
  trsId: string,
  workflowGates: WorkflowGates
) => boolean;
