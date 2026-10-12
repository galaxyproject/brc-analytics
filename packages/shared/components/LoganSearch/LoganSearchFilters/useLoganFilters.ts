import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_FILTERS,
  FILTER_PARAM_PREFIX,
  filterParams,
  filterQuery,
  type LoganFilters,
  type LoganListField,
  parseFilters,
  toggleValue,
  toggleYear as toggleYearIn,
} from "./filters";

export interface UseLoganFilters {
  clear: () => void;
  filters: LoganFilters;
  // The filter as f.* query parameters; "" when there is none, and always ""
  // while the flag is off.
  query: string;
  removeScore: () => void;
  removeYear: () => void;
  toggle: (field: LoganListField, value: string) => void;
  toggleYear: (year: number) => void;
}

/**
 * Write the filter into the page URL beside ?job=, replacing any f.* there.
 *
 * replaceState for the same reason the job param uses it: narrowing a result
 * a few times should not leave a trail of history entries for Back to walk.
 * @param filters - Filter to record.
 */
function syncFilterParams(filters: LoganFilters): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith(FILTER_PARAM_PREFIX)) url.searchParams.delete(key);
  }
  for (const [key, value] of filterParams(filters)) {
    url.searchParams.append(key, value);
  }
  window.history.replaceState(null, "", url);
}

/**
 * The reader's filter over a Logan search, held in the page URL so a filtered
 * view is a link.
 *
 * Inert while `enabled` is false: the filter reads as empty, the query as "",
 * and the URL is never read or written, so a page without the flag behaves
 * exactly as it did before filters existed, even when it is opened from a
 * filtered link.
 * @param enabled - Whether the logan-filters flag is on for this browser.
 * @returns The filter and the ways to change it.
 */
export function useLoganFilters(enabled: boolean): UseLoganFilters {
  const [filters, setFilters] = useState<LoganFilters>(EMPTY_FILTERS);

  // Read after mount: the page is statically generated, so the server render
  // has no URL to read and the first client render must match it. The flag
  // itself is false until hydration finishes, so this also runs then.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after hydration
    setFilters(enabled ? parseFilters(window.location.search) : EMPTY_FILTERS);
  }, [enabled]);

  const update = useCallback(
    (change: (current: LoganFilters) => LoganFilters): void => {
      if (!enabled) return;
      setFilters((current) => {
        const next = change(current);
        syncFilterParams(next);
        return next;
      });
    },
    [enabled]
  );

  const toggle = useCallback(
    (field: LoganListField, value: string): void =>
      update((current) => toggleValue(current, field, value)),
    [update]
  );
  const toggleYear = useCallback(
    (year: number): void => update((current) => toggleYearIn(current, year)),
    [update]
  );
  const removeYear = useCallback(
    (): void => update((current) => ({ ...current, year: null })),
    [update]
  );
  const removeScore = useCallback(
    (): void => update((current) => ({ ...current, score_min: null })),
    [update]
  );
  const clear = useCallback((): void => update(() => EMPTY_FILTERS), [update]);

  const query = useMemo(
    () => (enabled ? filterQuery(filters) : ""),
    [enabled, filters]
  );

  return {
    clear,
    filters: enabled ? filters : EMPTY_FILTERS,
    query,
    removeScore,
    removeYear,
    toggle,
    toggleYear,
  };
}
