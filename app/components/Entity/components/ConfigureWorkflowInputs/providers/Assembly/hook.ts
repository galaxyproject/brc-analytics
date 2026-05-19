import { useContext } from "react";
import { AssemblyContext } from "./context";
import type { AssemblyContextValue } from "./types";

/**
 * Custom hook to access the AssemblyContext.
 * @returns The context value containing the full assembly entity, or undefined if not available.
 */
export function useAssembly(): AssemblyContextValue | undefined {
  return useContext(AssemblyContext) ?? undefined;
}
