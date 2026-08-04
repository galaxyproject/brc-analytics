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
