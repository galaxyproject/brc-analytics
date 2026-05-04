import { useContext } from "react";
import { GenomeContext } from "./context";
import type { GenomeContextValue } from "./types";

/**
 * Custom hook to access the GenomeContext.
 * @returns The context value containing the full assembly entity.
 * @throws Error if used outside of a GenomeContext.Provider.
 */
export function useGenome(): GenomeContextValue {
  const context = useContext(GenomeContext);
  if (!context) {
    throw new Error("useGenome must be used within a GenomeContext.Provider");
  }
  return context;
}
