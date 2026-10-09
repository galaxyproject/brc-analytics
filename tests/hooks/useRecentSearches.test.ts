import {
  RECENT_SEARCHES_KEY,
  type RecentSearch,
} from "@brc/components/LoganSearch/LoganSearchHistory/recentSearches";
import { useRecentSearches } from "@brc/components/LoganSearch/LoganSearchHistory/useRecentSearches";
import { act, renderHook } from "@testing-library/react";

/**
 * A stored search.
 * @param jobId - Its job id.
 * @returns The entry.
 */
function entry(jobId: string): RecentSearch {
  return {
    indexes: ["GENOMIC_INV"],
    jobId,
    queryName: null,
    submittedAt: "2026-10-05T12:00:00.000Z",
    threshold: 0.5,
  };
}

/**
 * Put a list in storage the way another tab would.
 * @param searches - The list.
 */
function store(searches: RecentSearch[]): void {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

/**
 * The job ids currently in storage.
 * @returns The ids, or null when nothing is stored.
 */
function storedIds(): string[] | null {
  const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
  if (raw === null) return null;
  return (JSON.parse(raw) as RecentSearch[]).map((e) => e.jobId);
}

/**
 * Fire the event a browser sends when another tab changes storage.
 * @param key - The key that changed, or null for a full clear.
 */
function otherTabChanged(key: string | null): void {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
}

describe("useRecentSearches", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  test("loads the stored list after mount", () => {
    store([entry("b"), entry("a")]);
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches.map((e) => e.jobId)).toEqual(["b", "a"]);
  });

  test("shows another tab's new search live", () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);

    store([entry("from-other-tab")]);
    otherTabChanged(RECENT_SEARCHES_KEY);

    expect(result.current.searches.map((e) => e.jobId)).toEqual([
      "from-other-tab",
    ]);
  });

  test("ignores storage events for other keys", () => {
    const { result } = renderHook(() => useRecentSearches());
    store([entry("a")]);
    otherTabChanged("some-other-key");
    expect(result.current.searches).toEqual([]);
  });

  test("follows a clear in another tab, and doesn't bring it back", () => {
    store([entry("old")]);
    const { result } = renderHook(() => useRecentSearches());

    window.localStorage.clear();
    otherTabChanged(null);
    expect(result.current.searches).toEqual([]);

    act(() => result.current.record(entry("new")));
    expect(result.current.searches.map((e) => e.jobId)).toEqual(["new"]);
    expect(storedIds()).toEqual(["new"]);
  });

  test("builds on what another tab stored, even without its event", () => {
    const { result } = renderHook(() => useRecentSearches());
    store([entry("other")]);

    act(() => result.current.record(entry("mine")));

    expect(storedIds()).toEqual(["mine", "other"]);
    expect(result.current.searches.map((e) => e.jobId)).toEqual([
      "mine",
      "other",
    ]);
  });

  test("never writes over stored history it failed to read", () => {
    store([entry("kept")]);
    const { result } = renderHook(() => useRecentSearches());

    jest.spyOn(Storage.prototype, "getItem").mockImplementation((): never => {
      throw new Error("SecurityError");
    });
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    act(() => result.current.record(entry("mine")));

    expect(setItem).not.toHaveBeenCalled();
    expect(result.current.searches.map((e) => e.jobId)).toEqual([
      "mine",
      "kept",
    ]);
    jest.restoreAllMocks();
    expect(storedIds()).toEqual(["kept"]);
  });

  test("keeps a list in memory when storage reads but refuses writes", () => {
    const { result } = renderHook(() => useRecentSearches());
    jest.spyOn(Storage.prototype, "setItem").mockImplementation((): never => {
      throw new Error("QuotaExceededError");
    });

    act(() => result.current.record(entry("a")));
    act(() => result.current.record(entry("b")));

    expect(result.current.searches.map((e) => e.jobId)).toEqual(["b", "a"]);
    expect(storedIds()).toBeNull();
  });

  test("keeps a list in memory when storage is unavailable throughout", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((): never => {
      throw new Error("SecurityError");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation((): never => {
      throw new Error("SecurityError");
    });
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);

    act(() => result.current.record(entry("a")));
    act(() => result.current.record(entry("b")));
    expect(result.current.searches.map((e) => e.jobId)).toEqual(["b", "a"]);

    // A storage event that can't be read leaves the in-memory list alone.
    otherTabChanged(RECENT_SEARCHES_KEY);
    expect(result.current.searches.map((e) => e.jobId)).toEqual(["b", "a"]);
  });

  test("clear empties both the list and storage", () => {
    store([entry("a")]);
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.clear());
    expect(result.current.searches).toEqual([]);
    expect(storedIds()).toBeNull();
  });

  test("stops listening on unmount", () => {
    const add = jest.spyOn(window, "addEventListener");
    const remove = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useRecentSearches());

    const listener = add.mock.calls.find(([type]) => type === "storage")?.[1];
    expect(listener).toBeDefined();
    unmount();
    expect(remove).toHaveBeenCalledWith("storage", listener);
  });
});
