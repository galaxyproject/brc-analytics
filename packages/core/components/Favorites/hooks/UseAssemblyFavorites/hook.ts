import { useAuth } from "@brc-analytics/core/providers/authentication/provider";
import { apiClient } from "@brc-analytics/core/services/api-client";
import { FavoriteResponse } from "@brc-analytics/core/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseAssemblyFavoritesReturn {
  error: Error | null;
  favorites: FavoriteResponse[];
  isFavorited: (entityId: string) => boolean;
  isLoading: boolean;
  isToggling: boolean;
  toggleFavorite: (entityId: string) => Promise<void>;
}

export function useAssemblyFavorites(): UseAssemblyFavoritesReturn {
  const { isAuthenticated, isConfigured } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  // Default to loading so an authenticated page shows a spinner on first
  // paint instead of briefly flashing the "no favorites yet" empty state
  // before the initial load resolves.
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.entity_id)),
    [favorites]
  );

  const loadFavorites = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !isConfigured) {
      setFavorites([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setFavorites(await apiClient.getFavorites());
    } catch (err) {
      // Surface the failure so the page can render an error state
      // instead of falsely showing "no favorites yet."
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isConfigured]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    void loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    async (entityId: string): Promise<void> => {
      setError(null);
      // Gate re-entry so a double-click can't fire two create/delete calls
      // off the same pre-toggle `favoriteIds` snapshot.
      setIsToggling(true);
      try {
        if (!favoriteIds.has(entityId)) {
          const favorite = await apiClient.createFavorite(entityId);
          setFavorites((current) => [favorite, ...current]);
          return;
        }

        await apiClient.deleteFavorite(entityId);
        setFavorites((current) =>
          current.filter((favorite) => favorite.entity_id !== entityId)
        );
      } catch (err) {
        // Caller uses `void toggleFavorite(...)`; without this catch the
        // failure becomes an unhandled promise rejection and the button
        // state silently disagrees with the server.
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsToggling(false);
      }
    },
    [favoriteIds]
  );

  const isFavorited = useCallback(
    (entityId: string): boolean => favoriteIds.has(entityId),
    [favoriteIds]
  );

  return {
    error,
    favorites,
    isFavorited,
    isLoading,
    isToggling,
    toggleFavorite,
  };
}
