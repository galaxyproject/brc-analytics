import type { PageMeta } from "@repo/shared/meta/types";
import type { ParsedUrlQuery } from "querystring";

/**
 * URL params for the entity-list page — the entity type is the dynamic segment.
 */
export interface EntitiesPageParams extends ParsedUrlQuery {
  entityListType: string;
}

/**
 * Props for the entity-list page.
 */
export interface EntitiesPageProps extends Partial<PageMeta> {
  entityListType: string;
}

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
