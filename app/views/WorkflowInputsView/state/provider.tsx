import { JSX, ReactNode } from "react";
import { WorkflowInputsContext } from "./context";
import { useWorkflowInputsReducer } from "./hooks/UseWorkflowInputsReducer/hook";

/**
 * Provider for WorkflowInputsView state. Holds per-source handoff payloads
 * (currently just the assistant's) that survive navigation between the
 * assistant page and the stepper. Mount at the application root.
 * @param props - Props.
 * @param props.children - Children.
 * @returns Context provider wrapping the given children.
 */
export function WorkflowInputsStateProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const reducer = useWorkflowInputsReducer();
  return (
    <WorkflowInputsContext.Provider value={reducer}>
      {children}
    </WorkflowInputsContext.Provider>
  );
}
