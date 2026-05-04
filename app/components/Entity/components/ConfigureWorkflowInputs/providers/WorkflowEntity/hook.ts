import { useContext } from "react";
import { WorkflowEntityContext } from "./context";
import type { WorkflowEntityContextValue } from "./types";

/**
 * Custom hook to access the WorkflowEntityContext.
 * @returns The context value containing taxonomy fields for the workflow entity.
 * @throws Error if used outside of a WorkflowEntityContext.Provider.
 */
export function useWorkflowEntity(): WorkflowEntityContextValue {
  const context = useContext(WorkflowEntityContext);
  if (!context) {
    throw new Error(
      "useWorkflowEntity must be used within a WorkflowEntityContext.Provider"
    );
  }
  return context;
}
