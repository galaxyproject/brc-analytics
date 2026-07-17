import { useContext } from "react";
import { WorkflowEntityContext } from "./context";
import type { WorkflowEntityContextValue } from "./types";

/**
 * Custom hook to access the WorkflowEntityContext.
 * @returns The context value containing taxonomy fields, or undefined if not available.
 */
export function useWorkflowEntity(): WorkflowEntityContextValue | undefined {
  return useContext(WorkflowEntityContext) ?? undefined;
}
