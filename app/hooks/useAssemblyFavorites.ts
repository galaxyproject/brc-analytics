import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../providers/authentication";
import { brcAPIClient } from "../services/brc-api-client";
import { FavoriteResponse } from "../types/api";

interface UseAssemblyFavoritesReturn {
  favorites: FavoriteResponse[];
  isFavorited: (entityId: string) => boolean;
  isLoading: boolean;
  toggleFavorite: (entityId: string) => Promise<void>;
}

export function useAssemblyFavorites(): UseAssemblyFavoritesReturn {
  const { isAuthenticated, isConfigured } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.entity_id)),
    [favorites]
  );

  const loadFavorites = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !isConfigured) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      setFavorites(await brcAPIClient.getFavorites());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isConfigured]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    async (entityId: string): Promise<void> => {
      if (!favoriteIds.has(entityId)) {
        const favorite = await brcAPIClient.createFavorite(entityId);
        setFavorites((current) => [favorite, ...current]);
        return;
      }

      await brcAPIClient.deleteFavorite(entityId);
      setFavorites((current) =>
        current.filter((favorite) => favorite.entity_id !== entityId)
      );
    },
    [favoriteIds]
  );

  const isFavorited = useCallback(
    (entityId: string): boolean => favoriteIds.has(entityId),
    [favoriteIds]
  );

  return {
    favorites,
    isFavorited,
    isLoading,
    toggleFavorite,
  };
}
