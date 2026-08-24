import { ENTITY_TYPE } from "@repo/shared/providers/favorites/constants";
import type { FavoriteEntityType } from "@repo/shared/providers/favorites/types";
import { findEntity } from "@repo/shared/services/workflows/query";

interface EntityTypeDisplay {
  emptyState: string;
  entityRoute: string;
  title: string;
}

export const ENTITY_TYPE_DISPLAY: Record<
  FavoriteEntityType,
  EntityTypeDisplay
> = {
  [ENTITY_TYPE.ASSEMBLY]: {
    emptyState:
      "Save an assembly from its page or from the assemblies list to keep it here.",
    entityRoute: "assemblies",
    title: "Saved assemblies",
  },
  [ENTITY_TYPE.ORGANISM]: {
    emptyState:
      "Save an organism from its page or from the organisms list to keep it here.",
    entityRoute: "organisms",
    title: "Saved organisms",
  },
};

/**
 * Resolves a favorite to something a human recognises.
 *
 * An accession reads as an accession on its own, but a bare NCBI taxonomy id
 * says nothing -- so organisms have to be looked up. findEntity, not
 * getEntity: a favorite can outlive a catalog rebuild that drops its entity,
 * and getEntity throws.
 * @param entityType - Favorited entity type.
 * @param entityId - Favorited entity id.
 * @returns display name, falling back to the raw id.
 */
export function getFavoriteLabel(
  entityType: FavoriteEntityType,
  entityId: string
): string {
  if (entityType === ENTITY_TYPE.ORGANISM) {
    const organism = findEntity<{ taxonomicLevelSpecies?: string }>(
      "organisms",
      entityId
    );
    return organism?.taxonomicLevelSpecies || entityId;
  }
  return entityId;
}
