import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { type ReactNode } from "react";

interface BaseProps {
  children: ReactNode;
  fallback: ReactNode;
  trsId: string;
}

/**
 * Props for a page that configures a workflow for an entity, so its check
 * always receives the entity ID.
 */
export interface EntityProps extends BaseProps {
  entityId: string;
  isWorkflowAvailable: EntityWorkflowAvailability;
}

/**
 * Props for a page with no entity, whose check reads the TRS ID alone.
 */
export interface ListedProps extends BaseProps {
  entityId?: never;
  isWorkflowAvailable: ListedWorkflowAvailability;
}

/**
 * Determines whether the TRS ID from a URL names a workflow the entity's page
 * may open.
 */
export type EntityWorkflowAvailability = (
  trsId: string,
  workflowGates: WorkflowGates,
  entityId: string
) => boolean;

/**
 * Determines whether the TRS ID from a URL names a workflow a page with no
 * entity may open.
 */
export type ListedWorkflowAvailability = (
  trsId: string,
  workflowGates: WorkflowGates
) => boolean;

export type Props = EntityProps | ListedProps;
