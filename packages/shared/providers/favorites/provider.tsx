import { useAuth } from "@repo/shared/providers/authentication/provider";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { FavoriteResponse } from "@repo/shared/services/api-client/types";
import {
  createContext,
  type JSX,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FavoriteEntityType, FavoritesContextValue } from "./types";

/**
 * Composite key for one favorite.
 *
 * Keyed on both halves because entity ids are only unique within a type -- an
 * NCBI taxonomy id and an assembly accession share a namespace here otherwise.
 * @param entityType - Favorited entity type.
 * @param entityId - Favorited entity id.
 * @returns the lookup key.
 */
export function favoriteKey(
  entityType: FavoriteEntityType,
  entityId: string
): string {
  return `${entityType}:${entityId}`;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  error: null,
  favorites: [],
  isFavorited: () => false,
  isLoading: false,
  isToggling: false,
  toggleFavorite: async () => {},
  togglingKeys: new Set<string>(),
});

/**
 * Holds the signed-in user's favorites for the whole app.
 *
 * Hoisted out of the consuming hook because both list tables render a favorite
 * control per row -- ~5,500 assemblies and ~2,000 organisms -- so one fetch
 * per consumer would be one fetch per visible row, each with state that drifts
 * as soon as one of them toggles.
 * @param props - Component props.
 * @param props.children - Child components.
 * @returns favorites context provider wrapping children.
 */
export function FavoritesProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { isAuthenticated, isConfigured } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingKeys, setTogglingKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [error, setError] = useState<Error | null>(null);
  // Mirrors togglingKeys for the re-entry check below, which has to be
  // synchronous: setState is not, so two clicks in one tick would both read
  // an empty set and both fire.
  const pendingRef = useRef<Set<string>>(new Set());
  // Read inside toggleFavorite so the callback identity never changes -- a
  // changing identity would re-render every row of both tables.
  const keysRef = useRef<Set<string>>(new Set());

  const keys = useMemo(
    () =>
      new Set(
        favorites.map((favorite) =>
          favoriteKey(
            favorite.entity_type as FavoriteEntityType,
            favorite.entity_id
          )
        )
      ),
    [favorites]
  );
  // Written post-commit, not during render -- an interrupted render that
  // never commits must not mutate this shared ref. toggleFavorite only runs
  // from event handlers, which always fire after effects have flushed, so it
  // still observes the latest committed keys.
  useEffect(() => {
    keysRef.current = keys;
  }, [keys]);

  useEffect(() => {
    if (!isAuthenticated || !isConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
      setFavorites([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Unfiltered: one call covers both entity types.
    apiClient
      .getFavorites()
      .then((response) => {
        if (isMounted) setFavorites(response);
      })
      .catch((err) => {
        // Surface the failure so consumers render an error state instead of
        // falsely showing "no favorites yet."
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return (): void => {
      isMounted = false;
    };
  }, [isAuthenticated, isConfigured]);

  const toggleFavorite = useCallback(
    async (entityType: FavoriteEntityType, entityId: string): Promise<void> => {
      const key = favoriteKey(entityType, entityId);
      // One in-flight request per entity. Only the row being toggled is
      // disabled, so toggling a second row re-enables the first while its
      // request is still outstanding -- and a click then would fire a second
      // create off the same pre-toggle snapshot and list the favorite twice.
      if (pendingRef.current.has(key)) return;
      pendingRef.current.add(key);
      setError(null);
      setTogglingKeys(new Set(pendingRef.current));
      try {
        if (!keysRef.current.has(key)) {
          const favorite = await apiClient.createFavorite(entityId, entityType);
          setFavorites((current) => [favorite, ...current]);
          return;
        }

        await apiClient.deleteFavorite(entityId, entityType);
        setFavorites((current) =>
          current.filter(
            (favorite) =>
              favoriteKey(
                favorite.entity_type as FavoriteEntityType,
                favorite.entity_id
              ) !== key
          )
        );
      } catch (err) {
        // Callers use `void toggleFavorite(...)`; without this catch the
        // failure becomes an unhandled rejection and the control disagrees
        // with the server.
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        pendingRef.current.delete(key);
        setTogglingKeys(new Set(pendingRef.current));
      }
    },
    []
  );

  const isFavorited = useCallback(
    (entityType: FavoriteEntityType, entityId: string): boolean =>
      keys.has(favoriteKey(entityType, entityId)),
    [keys]
  );

  const value = useMemo(
    (): FavoritesContextValue => ({
      error,
      favorites,
      isFavorited,
      isLoading,
      isToggling: togglingKeys.size > 0,
      toggleFavorite,
      togglingKeys,
    }),
    [error, favorites, isFavorited, isLoading, toggleFavorite, togglingKeys]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Returns the shared favorites context.
 * @returns favorites context value.
 */
export function useFavorites(): FavoritesContextValue {
  return useContext(FavoritesContext);
}
