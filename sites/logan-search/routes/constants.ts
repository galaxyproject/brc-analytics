export const ROUTES = {
  LEARN: "/learn",
  MY_SEARCHES: "/my-searches",
  RESULTS: "/results",
  SEARCH: "/",
};

/**
 * The results page for one job.
 * @param jobId - Galaxy job id.
 * @returns The page's path and query.
 */
export function resultsHref(jobId: string): string {
  return `${ROUTES.RESULTS}?job=${encodeURIComponent(jobId)}`;
}

/**
 * The search form, filled in from a search this browser ran.
 * @param jobId - Galaxy job id of the search to edit.
 * @returns The page's path and query.
 */
export function editSearchHref(jobId: string): string {
  return `${ROUTES.SEARCH}?edit=${encodeURIComponent(jobId)}`;
}
