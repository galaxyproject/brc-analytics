import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { type ReactNode } from "react";

export interface Props {
  children: ReactNode;
  entityId?: string;
  fallback: ReactNode;
  isWorkflowAvailable: WorkflowAvailability;
  trsId: string;
}

/**
 * Determines whether the TRS ID from a URL names a workflow the page may open:
 * for the given entity, or on its own when the page has none.
 */
export type WorkflowAvailability = (
  trsId: string,
  workflowGates: WorkflowGates,
  entityId?: string
) => boolean;
