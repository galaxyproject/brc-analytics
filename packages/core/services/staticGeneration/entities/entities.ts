import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { EntitiesPageMeta, EntitiesPageProps, Params } from "./types";

/**
 * Builds the shared getStaticPaths for an entity-list page: one path per
 * non-workflow entity type the site configures.
 * @param config - Site config accessor (provides the site's entity configs).
 * @returns getStaticPaths.
 */
export function makeEntitiesStaticPaths(
  config: () => Pick<SiteConfig, "entities">
): GetStaticPaths<Params> {
  return async () => {
    const { entities } = config();
    const paths = entities
      .filter((entity) => entity.route !== "workflows")
      .map((entity) => ({ params: { entityListType: entity.route } }));
    return { fallback: false, paths };
  };
}

/**
 * Builds the shared getStaticProps for an entity-list page: resolves the entity
 * config for the route, attaches the site's per-route page metadata, and — for
 * client-side-filtered entity types — seeds and fetches the full list at build.
 * @param config - Site config accessor.
 * @param metaByRoute - Per-route page metadata for the site.
 * @returns getStaticProps.
 */
export function makeEntitiesStaticProps<R>(
  config: () => Pick<SiteConfig, "entities">,
  metaByRoute: EntitiesPageMeta
): GetStaticProps<EntitiesPageProps<R>> {
  return async ({ params }: GetStaticPropsContext) => {
    const { entityListType } = params as Params;
    const { entities } = config();
    const entityConfig = getEntityConfig(entities, entityListType);
    const { exploreMode } = entityConfig;
    const { fetchAllEntities } = getEntityService(entityConfig, undefined);
    const entityMeta = metaByRoute[entityListType];
    const props: EntitiesPageProps<R> = {
      entityListType,
      pageDescription: entityMeta?.pageDescription,
      pageTitle: entityMeta?.pageTitle,
    };
    // Client-side-filtered entity types are seeded + fetched at build; others
    // are fetched server-side at request time, so carry no build-time data.
    if (exploreMode === EXPLORE_MODE.CS_FETCH_CS_FILTERING) {
      await seedDatabase(entityListType, entityConfig);
      props.data = await fetchAllEntities(entityListType, undefined);
    }
    return { props };
  };
}
