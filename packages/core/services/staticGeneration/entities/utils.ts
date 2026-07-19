import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EntitiesResponse } from "./types";

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
