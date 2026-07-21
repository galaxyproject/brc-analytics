import type { EntitiesResponse } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { getEntities } from "@/services/workflows/query";
import type { EntityRoute } from "@/services/workflows/types";

/**
 * Build an explore-view data response from the client-loaded entity store.
 * Throws (via getEntities) when the store has no entry for the requested type,
 * so a misconfigured or unloaded route surfaces through the error boundary
 * instead of silently rendering an empty table.
 * @param entityListType - Entity list type.
 * @returns entities response consumed by the explore view.
 */
export function getEntitiesResponse<T>(
  entityListType: string
): EntitiesResponse<T> {
  const hits = getEntities<T>(entityListType as EntityRoute);
  return {
    hits,
    pagination: {
      count: hits.length,
      pages: 1,
      size: hits.length,
      total: hits.length,
    },
    termFacets: {},
  };
}
