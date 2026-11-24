import { getEntities } from "@repo/shared/services/workflows/query";
import type { EntityRoute } from "@repo/shared/services/workflows/types";

/**
 * Build the explore view's entities from the client-loaded entity store.
 * Throws (via getEntities) for an unknown entity list type, so a misconfigured
 * route surfaces through the error boundary instead of silently rendering an
 * empty table. Returns a shallow copy of the store's array so downstream
 * in-place operations (e.g. sorting) can't mutate the shared store.
 * @param entityListType - Entity list type.
 * @returns entities consumed by the explore view.
 */
export function getEntitiesData<T>(entityListType: string): T[] {
  return [...getEntities<T>(entityListType as EntityRoute)];
}
