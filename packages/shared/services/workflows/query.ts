import { getEntitiesById, getEntitiesByType } from "./store";
import type { EntityRoute } from "./types";

/**
 * Finds entities by entity list type, returning undefined when none are loaded.
 * @param entityListType - Entity list type.
 * @returns Entities, or undefined when none are loaded.
 */
export function findEntities<T>(entityListType: EntityRoute): T[] | undefined {
  return getEntitiesByType().get(entityListType) as T[] | undefined;
}

/**
 * Finds an entity by entity list type and entity id, returning undefined when
 * there is no match.
 * @param entityListType - Entity list type.
 * @param entityId - Entity id.
 * @returns Entity, or undefined when not found.
 */
export function findEntity<T>(
  entityListType: EntityRoute,
  entityId: string
): T | undefined {
  return getEntitiesById().get(entityListType)?.get(entityId) as T | undefined;
}

/**
 * Gets entities by entity list type.
 * @param entityListType - Entity list type.
 * @returns Map of entity list types to entities.
 */
export function getEntities<T>(entityListType: EntityRoute): T[] {
  const entities = findEntities<T>(entityListType);

  if (!entities)
    throw new Error(
      `No entities found for entity list type: ${entityListType}`
    );

  return entities;
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
