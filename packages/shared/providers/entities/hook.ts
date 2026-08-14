import { type UseEntities } from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { useContext } from "react";
import { EntitiesContext } from "./context";

/**
 * Reads the workflows-entity-cache load state from context.
 * @returns Entity cache load state: loaded flag, and error when the load failed.
 */
export function useEntitiesState(): UseEntities {
  return useContext(EntitiesContext);
}
