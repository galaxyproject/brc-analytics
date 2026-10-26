import { type UseEntities } from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { useContext } from "react";
import { EntitiesContext } from "./context";

/**
 * Reads the entity cache load state from context.
 * @returns Whether the loader has run, and the load state per entity list:
 * loaded flag, and error when that list's load failed.
 */
export function useEntitiesState(): UseEntities {
  return useContext(EntitiesContext);
}
