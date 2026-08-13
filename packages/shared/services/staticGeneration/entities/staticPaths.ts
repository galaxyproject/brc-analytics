import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { GetStaticPaths } from "next";
import type { EntitiesPageParams } from "./types";

/**
 * Builds getStaticPaths for the entity-list page — one path per entity route
 * the site exposes as an explore list. Pass the routes to include (typically
 * the keys of the site's page-meta map) so a site never generates a list path
 * it has no metadata for.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param routes - Entity routes to include as explore list pages.
 * @returns getStaticPaths.
 */
export function makeEntitiesStaticPaths(
  config: () => Pick<SiteConfig, "entities">,
  routes: string[]
): GetStaticPaths<EntitiesPageParams> {
  return async () => ({
    fallback: false,
    paths: config()
      .entities.filter((entity) => routes.includes(entity.route))
      .map((entity) => ({ params: { entityListType: entity.route } })),
  });
}
