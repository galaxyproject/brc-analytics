import { JSX, ReactNode } from "react";
import { WorkflowHandoffContext } from "./context";
import { useWorkflowHandoffReducer } from "./hooks/UseWorkflowHandoffReducer/hook";

/**
 * Provider for WorkflowInputsView state. Holds per-source handoff payloads
 * (currently just the assistant's) that survive navigation between the
 * assistant page and the stepper. Mount at the application root.
 * @param props - Props.
 * @param props.children - Children.
 * @returns Context provider wrapping the given children.
 */
export function WorkflowHandoffProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const reducer = useWorkflowHandoffReducer();
  return (
    <WorkflowHandoffContext.Provider value={reducer}>
      {children}
    </WorkflowHandoffContext.Provider>
  );
}
