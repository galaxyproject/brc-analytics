import type { PageMeta } from "@repo/shared/meta/types";
import type { ParsedUrlQuery } from "querystring";

/**
 * URL params for an entity page under an explicit per-type route — the entity
 * type is the static route segment, so only the entity ID is dynamic.
 */
export interface EntityPageParams extends ParsedUrlQuery {
  entityId: string;
}

/**
 * Props for an entity page. `data` carries the build-time entity record for
 * static-loading detail pages; pages that render the entity client-side omit it.
 */
export interface EntityPageProps<R> extends Partial<PageMeta> {
  data?: R;
  entityId: string;
  entityListType: string;
}
