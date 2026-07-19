import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import {
  EntityConfig,
  SiteConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { EntitiesResponse } from "../entities/types";
import { getEntities } from "../entities/utils";
import { EntityPageMeta, EntityPageProps, Params } from "./types";
import { getEntity } from "./utils";

/**
 * Builds the shared getStaticPaths for an entity-detail page: one path per
 * statically-loadable entity across every non-workflow entity type. The site
 * differs only by the entity configs it supplies via its config accessor.
 * @param config - Site config accessor (provides the site's entity configs).
 * @returns getStaticPaths.
 */
export function makeEntityStaticPaths(
  config: () => Pick<SiteConfig, "entities">
): GetStaticPaths<Params> {
  return async () => {
    const { entities } = config();
    const paths: GetStaticPathsResult<Params>["paths"] = [];
    for (const entityConfig of entities) {
      const { route: entityListType } = entityConfig;
      if (entityListType === "workflows") continue;
      await seedDatabase(entityListType, entityConfig);
      const entitiesResponse = await getEntities(entityConfig);
      processEntityPaths(entityConfig, entitiesResponse, paths);
    }
    return { fallback: false, paths };
  };
}

/**
 * Builds the shared getStaticProps for an entity-detail page: validates params,
 * seeds + fetches the entity, and attaches the site's per-route page metadata.
 * @param config - Site config accessor.
 * @param metaByRoute - Per-route page metadata for the site.
 * @returns getStaticProps.
 */
export function makeEntityStaticProps<R>(
  config: () => Pick<SiteConfig, "entities">,
  metaByRoute: EntityPageMeta
): GetStaticProps<EntityPageProps<R>> {
  return async ({ params }: GetStaticPropsContext) => {
    if (!hasValidParams(params)) return { notFound: true };
    const { entityId, entityListType } = params;
    const { entities } = config();
    const entityConfig = getEntityConfig(entities, entityListType);
    const entityMeta = metaByRoute[entityListType];
    const props: EntityPageProps<R> = {
      entityId,
      entityListType,
      pageDescription: entityMeta?.pageDescription,
      pageTitle: entityMeta?.pageTitle,
    };
    // Only attach `data` when present — Next.js getStaticProps rejects
    // `undefined` prop values (a non-static entity type, or a falsy detail
    // fetch, yields no data and the key must be omitted, not set undefined).
    const data = await fetchEntityData<R>(entityConfig, entityId);
    if (data !== undefined) props.data = data;
    return { props };
  };
}

/**
 * Fetches an entity's detail data for a statically-loaded entity type.
 * @param entityConfig - Entity config.
 * @param entityId - Entity ID.
 * @returns The entity detail, or undefined if the entity type is not statically loaded.
 */
async function fetchEntityData<R>(
  entityConfig: EntityConfig,
  entityId: string
): Promise<R | undefined> {
  // Non-static entity types carry no build-time detail data.
  if (!entityConfig.detail.staticLoad) return undefined;
  await seedDatabase(entityConfig.route, entityConfig);
  const entity = (await getEntity(entityConfig, entityId)) as R;
  return entity || undefined;
}

/**
 * Type guard narrowing route params to the entity-detail Params shape.
 * @param params - The route params from the URL.
 * @returns True if entityListType and entityId are both strings.
 */
function hasValidParams(params: ParsedUrlQuery | undefined): params is Params {
  return (
    typeof params?.entityListType === "string" &&
    typeof params?.entityId === "string"
  );
}

/**
 * Processes the static paths for the given entity response.
 * @param entityConfig - Entity config.
 * @param entitiesResponse - Entities response.
 * @param paths - Static paths.
 */
function processEntityPaths<R>(
  entityConfig: EntityConfig,
  entitiesResponse: EntitiesResponse<R>,
  paths: GetStaticPathsResult<Params>["paths"]
): void {
  const { route: entityListType } = entityConfig;
  const { hits: entities } = entitiesResponse;
  for (const entity of entities) {
    const entityId = entityConfig.getId?.(entity);
    if (!entityId) continue;
    paths.push({
      params: {
        entityId,
        entityListType,
      },
    });
  }
}
