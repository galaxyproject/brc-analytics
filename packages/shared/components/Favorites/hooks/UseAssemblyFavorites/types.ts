import type { FavoriteResponse } from "@repo/shared/services/api-client/types";

export interface UseAssemblyFavoritesReturn {
  error: Error | null;
  favorites: FavoriteResponse[];
  isFavorited: (entityId: string) => boolean;
  isLoading: boolean;
  isToggling: boolean;
  toggleFavorite: (entityId: string) => Promise<void>;
}
