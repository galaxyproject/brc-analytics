import { useContext } from "react";
import { GenomeContext } from "./context";
import type { GenomeContextValue } from "./types";

/**
 * Custom hook to access the GenomeContext.
 * @returns The context value containing the full assembly entity, or undefined if not available.
 */
export function useGenome(): GenomeContextValue | undefined {
  return useContext(GenomeContext) ?? undefined;
}
