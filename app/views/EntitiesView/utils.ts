import type { EntitiesResponse } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { getEntitiesByType } from "@/services/workflows/store";
import type { EntityRoute } from "@/services/workflows/types";

/**
 * Build an explore-view data response from the client-loaded entity store.
 * @param entityListType - Entity list type.
 * @returns entities response consumed by the explore view.
 */
export function getEntitiesResponse<T>(
  entityListType: string
): EntitiesResponse<T> {
  const hits = (getEntitiesByType().get(entityListType as EntityRoute) ??
    []) as T[];
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
