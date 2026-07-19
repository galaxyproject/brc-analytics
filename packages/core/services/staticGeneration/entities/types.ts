/**
 * Site-neutral response wrapper for entity lists, as produced by the fetch
 * utils and consumed by the entity pages. Generic over the concrete catalog
 * entity `R`; neither site's catalog type leaks into it.
 */
export interface EntitiesResponse<R> {
  hits: R[];
  pagination: EntitiesResponsePagination;
  termFacets: Record<never, never>;
}

interface EntitiesResponsePagination {
  count: number;
  pages: number;
  size: number;
  total: number;
}
