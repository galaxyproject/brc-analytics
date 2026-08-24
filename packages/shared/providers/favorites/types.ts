import type { FavoriteResponse } from "@repo/shared/services/api-client/types";
import type { ENTITY_TYPE } from "./constants";

export type FavoriteEntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

export interface FavoritesContextValue {
  error: Error | null;
  favorites: FavoriteResponse[];
  isFavorited: (entityType: FavoriteEntityType, entityId: string) => boolean;
  isLoading: boolean;
  isToggling: boolean;
  toggleFavorite: (
    entityType: FavoriteEntityType,
    entityId: string
  ) => Promise<void>;
  togglingKey: string | null;
}
