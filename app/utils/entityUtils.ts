import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EntitiesResponse } from "../apis/catalog/brc-analytics-catalog/common/entities";

/**
 * Fetches entities response for the given entity config.
 * @param entityConfig - Entity config.
 * @returns entities response.
 */
export async function getEntities<R>(
  entityConfig: EntityConfig
): Promise<EntitiesResponse<R>> {
  const { fetchAllEntities, path } = getEntityService(entityConfig, undefined);
  return await fetchAllEntities(path, undefined, undefined, undefined);
}

/**
 * Fetches the entity for the given entity ID.
 * @param entityConfig - Entity config.
 * @param entityId - Entity ID.
 * @returns entity response.
 */
export async function getEntity<R>(
  entityConfig: EntityConfig,
  entityId: string
): Promise<R> {
  const { fetchEntityDetail, path } = getEntityService(entityConfig, undefined);
  return await fetchEntityDetail(
    entityId,
    path,
    undefined,
    undefined,
    undefined,
    true
  );
}
