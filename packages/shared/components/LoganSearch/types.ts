/**
 * Where the Logan search links to on the site that mounts it. Shared code
 * can't name one site's routes, so the page passes them in.
 */
export interface LoganSearchRoutes {
  // Builds the link that hands a finished search to the site's assistant.
  // Without it the "Ask the assistant" button isn't rendered.
  assistantHref?: (jobId: string) => string;
  // The path the search is mounted at; past searches reopen at `${searchPath}?job=`.
  searchPath: string;
}
