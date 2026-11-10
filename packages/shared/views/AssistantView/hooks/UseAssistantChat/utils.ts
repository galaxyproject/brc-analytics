import type { NextRouter } from "next/router";

/**
 * The saved analysis the conversation on screen belongs to, after a turn. A
 * session's analysis never changes, so a reply without one for the same session
 * keeps the one already known; a different session takes the reply's.
 * @param current - Saved analysis known before the turn, or null.
 * @param reported - Saved analysis the turn's reply reports, or null.
 * @param isSameSession - Whether the turn ran in the session already on screen.
 * @returns The saved analysis to show as open, or null.
 */
export function keepSavedAnalysisId(
  current: string | null,
  reported: string | null,
  isSameSession: boolean
): string | null {
  if (reported !== null) return reported;
  return isSameSession ? current : null;
}

/**
 * Replaces the current URL's query, staying on the same page without
 * reloading it.
 * @param router - Next router.
 * @param query - The query the URL should carry.
 */
export function replaceQuery(
  router: NextRouter,
  query: NextRouter["query"]
): void {
  router
    .replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    .catch(() => {
      // Cosmetic: the URL only records what is already on screen.
    });
}

/**
 * Drops query parameters from the current URL, leaving the rest of the route
 * untouched.
 * @param router - Next router.
 * @param names - Query parameters to drop.
 */
export function stripQueryParam(router: NextRouter, names: string[]): void {
  const query = { ...router.query };
  for (const name of names) delete query[name];
  replaceQuery(router, query);
}
