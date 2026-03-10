import { useContext } from "react";
import { StepContext } from "./context";
import { StepContextValue } from "./types";

/**
 * Custom hook to access the StepContext.
 * @returns The context value containing step callbacks and stepKey.
 * @throws Error if used outside of a StepContext.Provider.
 */
export function useStepContext(): StepContextValue {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error(
      "useStepContext must be used within a StepContext.Provider"
    );
  }
  return context;
}
