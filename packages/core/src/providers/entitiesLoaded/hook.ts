import { useContext } from "react";
import { EntitiesLoadedContext } from "./context";

/**
 * Reads the workflows-entity-cache loaded boolean from context.
 * @returns true once the cache has been loaded into memory.
 */
export function useEntitiesLoaded(): boolean {
  return useContext(EntitiesLoadedContext);
}
