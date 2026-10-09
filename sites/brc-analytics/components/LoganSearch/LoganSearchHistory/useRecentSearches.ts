import { useCallback, useEffect, useState } from "react";
import {
  clearRecentSearches,
  readRecentSearches,
  RECENT_SEARCHES_KEY,
  type RecentSearch,
  withRecentSearch,
  writeRecentSearches,
} from "./recentSearches";

export interface UseRecentSearches {
  clear: () => void;
  record: (search: RecentSearch) => void;
  searches: RecentSearch[];
}

/**
 * The browser-local list of recent Logan searches, kept in step with other
 * tabs on the same origin.
 * @returns The list, newest first, and the two ways to change it.
 */
export function useRecentSearches(): UseRecentSearches {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  // Read after mount, not during render: the page is statically generated, so
  // the server's render has no storage and the first client render must match
  // it.
  useEffect(() => {
    /**
     * Take the stored list, leaving what's on screen alone when storage
     * can't be read.
     */
    const sync = (): void => {
      const stored = readRecentSearches();
      if (stored.status === "ok") setSearches(stored.searches);
    };

    /**
     * Pick up another tab's search or clear. The event never fires in the
     * tab that made the change, and a null key means storage was wiped.
     * @param event - The storage event.
     */
    const onStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key === RECENT_SEARCHES_KEY) sync();
    };

    sync();
    window.addEventListener("storage", onStorage);
    return (): void => window.removeEventListener("storage", onStorage);
  }, []);

  const record = useCallback((search: RecentSearch): void => {
    // Build on storage, not memory, so another tab's searches (or its clear)
    // since this one last synced aren't overwritten.
    const stored = readRecentSearches();
    if (stored.status === "ok") {
      const next = withRecentSearch(stored.searches, search);
      writeRecentSearches(next);
      setSearches(next);
      return;
    }
    // Unreadable storage might still hold history, so don't write over it;
    // the list lives in memory for the page's lifetime instead.
    setSearches((prev) => withRecentSearch(prev, search));
  }, []);

  const clear = useCallback((): void => {
    clearRecentSearches();
    setSearches([]);
  }, []);

  return { clear, record, searches };
}
