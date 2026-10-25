export interface RecentSearch {
  indexes: string[];
  jobId: string;
  // The FASTA header's first word, which is what kmindex reports the query
  // as. Null for a query pasted without a header.
  queryName: string | null;
  // The query as submitted, in FASTA form, so the search can be edited and
  // run again. Absent on entries stored before it was kept.
  sequence?: string;
  // ISO 8601.
  submittedAt: string;
  threshold: number;
  // Runs the search matched, noted when its results were last opened here.
  // Absent until then, and on entries stored before it was kept.
  totalMatches?: number;
}

export const RECENT_SEARCHES_KEY = "brc-logan-recent-searches";
export const MAX_RECENT_SEARCHES = 20;
// Fired on window after every write or clear. The storage event only reaches
// other tabs, and the header's count has to follow a search made in this one.
export const RECENT_SEARCHES_EVENT = "brc-logan-recent-searches-change";

/**
 * The name kmindex will report a query under: the first word of its FASTA
 * header.
 * @param sequence - The query as submitted.
 * @returns The name, or null when the query has no header.
 */
export function queryNameOf(sequence: string): string | null {
  const header = sequence
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!header?.startsWith(">")) return null;
  const name = header.slice(1).trim().split(/\s+/)[0];
  return name || null;
}

/**
 * Whether a parsed value is a well-formed entry. The list is read back from
 * storage anything else on the origin could have written to, so nothing in
 * it is trusted.
 * @param value - One parsed element.
 * @returns True when every field has the right shape.
 */
function isRecentSearch(value: unknown): value is RecentSearch {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.jobId === "string" &&
    entry.jobId.length > 0 &&
    Array.isArray(entry.indexes) &&
    entry.indexes.every((index) => typeof index === "string") &&
    (entry.queryName === null || typeof entry.queryName === "string") &&
    (entry.sequence === undefined || typeof entry.sequence === "string") &&
    (entry.totalMatches === undefined ||
      typeof entry.totalMatches === "number") &&
    typeof entry.submittedAt === "string" &&
    typeof entry.threshold === "number"
  );
}

/**
 * What a read of the stored list found. "unavailable" is kept apart from an
 * empty list so a caller never writes over history it simply couldn't see.
 */
export type RecentSearchesRead =
  | { searches: RecentSearch[]; status: "ok" }
  | { status: "unavailable" };

/**
 * The searches this browser has submitted, newest first.
 *
 * Storage can be missing, blocked, or throw on access (private windows,
 * cleared site data, a sandboxed preview), and none of that should cost the
 * page anything but this list.
 * @returns The stored searches, or "unavailable" when storage can't be read.
 */
export function readRecentSearches(): RecentSearchesRead {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
  } catch {
    return { status: "unavailable" };
  }
  if (!raw) return { searches: [], status: "ok" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { searches: [], status: "ok" };
    return {
      searches: parsed.filter(isRecentSearch).slice(0, MAX_RECENT_SEARCHES),
      status: "ok",
    };
  } catch {
    // Unparseable is readable but empty: there is nothing in it to keep, and
    // refusing to overwrite it would leave the list broken for good.
    return { searches: [], status: "ok" };
  }
}

/**
 * Store the list, quietly giving up if storage refuses it.
 * @param searches - The list to keep.
 * @returns Whether the list was stored.
 */
export function writeRecentSearches(searches: RecentSearch[]): boolean {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
    return true;
  } catch {
    // Full or blocked storage just means the list doesn't outlive the page.
    return false;
  }
}

/**
 * Put a search at the top of the list, dropping an older entry for the same
 * job and anything past the cap.
 * @param searches - The current list.
 * @param search - The search just submitted.
 * @returns The new list. Nothing is stored.
 */
export function withRecentSearch(
  searches: RecentSearch[],
  search: RecentSearch
): RecentSearch[] {
  return [
    search,
    ...searches.filter((entry) => entry.jobId !== search.jobId),
  ].slice(0, MAX_RECENT_SEARCHES);
}

/**
 * Note how many runs a stored search matched.
 * @param searches - The current list.
 * @param jobId - The search's job id.
 * @param totalMatches - Runs it matched.
 * @returns The new list, or the same one when nothing changed. Nothing is
 * stored.
 */
export function withSearchMatches(
  searches: RecentSearch[],
  jobId: string,
  totalMatches: number
): RecentSearch[] {
  const entry = searches.find((search) => search.jobId === jobId);
  if (!entry || entry.totalMatches === totalMatches) return searches;
  return searches.map((search) =>
    search === entry ? { ...search, totalMatches } : search
  );
}

/**
 * Forget every stored search.
 */
export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Nothing stored that we could reach, so nothing to clear.
  }
  window.dispatchEvent(new Event(RECENT_SEARCHES_EVENT));
}
