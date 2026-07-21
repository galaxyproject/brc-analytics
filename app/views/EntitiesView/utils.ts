import type { EntitiesResponse } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { getEntities } from "@/services/workflows/query";
import type { EntityRoute } from "@/services/workflows/types";

/**
 * Build an explore-view data response from the client-loaded entity store.
 * Throws (via getEntities) for an unknown entity list type, so a misconfigured
 * route surfaces through the error boundary instead of silently rendering an
 * empty table. Returns a shallow copy of the store's array so downstream
 * in-place operations (e.g. sorting) can't mutate the shared store.
 * @param entityListType - Entity list type.
 * @returns entities response consumed by the explore view.
 */
export function getEntitiesResponse<T>(
  entityListType: string
): EntitiesResponse<T> {
  const entities = getEntities<T>(entityListType as EntityRoute);
  return {
    hits: [...entities],
    pagination: {
      count: entities.length,
      pages: 1,
      size: entities.length,
      total: entities.length,
    },
    termFacets: {},
  };
}
