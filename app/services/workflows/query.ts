import { getEntitiesById, getEntitiesByType } from "./store";
import { EntityRoute } from "./types";

/**
 * Gets entities by entity list type.
 * @param entityListType - Entity list type.
 * @returns Map of entity list types to entities.
 */
export function getEntities<T>(entityListType: EntityRoute): T[] {
  const entities = getEntitiesByType().get(entityListType);

  if (!entities)
    throw new Error(
      `No entities found for entity list type: ${entityListType}`
    );

  return entities as T[];
}

/**
 * Gets entity by entity list type and entity id.
 * @param entityListType - Entity list type.
 * @param entityId - Entity id.
 * @returns Entity.
 */
export function getEntity<T>(entityListType: EntityRoute, entityId: string): T {
  const entity = getEntitiesById().get(entityListType)?.get(entityId);

  if (!entity)
    throw new Error(
      `No entity found for entity list type: ${entityListType} and entity id: ${entityId}`
    );

  return entity as T;
}
