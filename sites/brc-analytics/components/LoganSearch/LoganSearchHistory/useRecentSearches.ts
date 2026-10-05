import { useCallback, useEffect, useState } from "react";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  type RecentSearch,
} from "./recentSearches";

export interface UseRecentSearches {
  clear: () => void;
  record: (search: RecentSearch) => void;
  searches: RecentSearch[];
}

/**
 * The browser-local list of recent Logan searches.
 * @returns The list, newest first, and the two ways to change it.
 */
export function useRecentSearches(): UseRecentSearches {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  // Read after mount, not during render: the page is statically generated, so
  // the server's render has no storage and the first client render must match
  // it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is only readable after hydration
    setSearches(readRecentSearches());
  }, []);

  const record = useCallback((search: RecentSearch): void => {
    setSearches((prev) => {
      // Storage first, so another tab's searches since this one loaded are
      // kept; what's in memory only when storage has nothing, which is also
      // how the list keeps working for the page's lifetime without storage.
      const stored = readRecentSearches();
      return addRecentSearch(stored.length > 0 ? stored : prev, search);
    });
  }, []);

  const clear = useCallback((): void => {
    clearRecentSearches();
    setSearches([]);
  }, []);

  return { clear, record, searches };
}
