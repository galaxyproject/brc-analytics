import { EntityRoute } from "./types";

// entityListType -> T[]
const ENTITIES_BY_TYPE = new Map<EntityRoute, unknown[]>();

// entityListType -> entityId -> T
const ENTITIES_BY_ENTITY_ID = new Map<EntityRoute, Map<string, unknown>>();

/**
 * Gets entities by entity id.
 * @returns Map of entity list types to entity id to entity.
 */
export function getEntitiesById(): Map<EntityRoute, Map<string, unknown>> {
  return ENTITIES_BY_ENTITY_ID as Map<EntityRoute, Map<string, unknown>>;
}

/**
 * Gets entities by entity list type.
 * @returns Map of entity list types to entities.
 */
export function getEntitiesByType(): Map<EntityRoute, unknown[]> {
  return ENTITIES_BY_TYPE as Map<EntityRoute, unknown[]>;
}

/**
 * Sets entities by entity id.
 * @param entityListType - Entity list type.
 * @param entitiesById - Map of entity id to entity.
 */
export function setEntitiesById(
  entityListType: EntityRoute,
  entitiesById: Map<string, unknown>
): void {
  ENTITIES_BY_ENTITY_ID.set(entityListType, entitiesById);
}

/**
 * Sets entities by entity list type.
 * @param entityListType - Entity list type.
 * @param entities - Entities.
 */
export function setEntitiesByType(
  entityListType: EntityRoute,
  entities: unknown[]
): void {
  ENTITIES_BY_TYPE.set(entityListType, entities);
}
