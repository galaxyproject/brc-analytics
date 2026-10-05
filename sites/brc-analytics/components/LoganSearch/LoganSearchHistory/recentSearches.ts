export interface RecentSearch {
  indexes: string[];
  jobId: string;
  // The FASTA header's first word, which is what kmindex reports the query
  // as. Null for a query pasted without a header.
  queryName: string | null;
  // ISO 8601.
  submittedAt: string;
  threshold: number;
}

export const RECENT_SEARCHES_KEY = "brc-logan-recent-searches";
export const MAX_RECENT_SEARCHES = 20;

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
    typeof entry.submittedAt === "string" &&
    typeof entry.threshold === "number"
  );
}

/**
 * The searches this browser has submitted, newest first.
 *
 * Storage can be missing, blocked, or throw on access (private windows,
 * cleared site data, a sandboxed preview), and none of that should cost the
 * page anything but this list.
 * @returns The stored searches, or an empty list when storage is unavailable.
 */
export function readRecentSearches(): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentSearch).slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/**
 * Store the list, quietly giving up if storage refuses it.
 * @param searches - The list to keep.
 */
function writeRecentSearches(searches: RecentSearch[]): void {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Full or blocked storage just means the list doesn't outlive the page.
  }
}

/**
 * Put a search at the top of the list, dropping an older entry for the same
 * job and anything past the cap.
 * @param searches - The current list.
 * @param search - The search just submitted.
 * @returns The new list, which has also been stored.
 */
export function addRecentSearch(
  searches: RecentSearch[],
  search: RecentSearch
): RecentSearch[] {
  const next = [
    search,
    ...searches.filter((entry) => entry.jobId !== search.jobId),
  ].slice(0, MAX_RECENT_SEARCHES);
  writeRecentSearches(next);
  return next;
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
}
