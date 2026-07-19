import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";

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
