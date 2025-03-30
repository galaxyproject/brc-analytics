import {
  PARAMS_INDEX_TAB,
  PARAMS_INDEX_UUID,
} from "@databiosphere/findable-ui/lib/common/constants";
import {
  BackPageTabConfig,
  EntityConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import {
  BRCCatalog,
  EntitiesResponse,
} from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { config } from "../../../../app/config/config";
import { seedDatabase } from "../../../../app/utils/seedDatabase";
import { EntityDetailView } from "../../../../app/views/EntityView/entityView";

const setOfProcessedIds = new Set<string>();

interface StaticPath {
  params: PageUrl;
}

interface PageUrl extends ParsedUrlQuery {
  entityListType: string;
  params: string[];
}

export interface EntityPageProps<R> {
  data?: R;
  entityListType: string;
}

/**
 * Entity detail view page.
 * @param props - Entity detail view page props.
 * @returns Entity detail view component.
 */
const EntityDetailPage = <R,>(props: EntityPageProps<R>): JSX.Element => {
  if (!props.entityListType) return <></>;
  return <EntityDetailView {...props} />;
};

/**
 * getStaticPaths - return the list of paths to prerender for each entity type and its tabs.
 * @returns Promise<GetStaticPaths<PageUrl>>.
 */
export const getStaticPaths: GetStaticPaths<PageUrl> = async () => {
  const appConfig = config();
  const { entities } = appConfig;

  const paths: StaticPath[] = [];

  for (const entityConfig of entities) {
    const { exploreMode, route: entityListType } = entityConfig;
    // Process static paths.
    // Client-side fetch, client-side filtering.
    if (exploreMode === EXPLORE_MODE.CS_FETCH_CS_FILTERING) {
      await seedDatabase(entityListType, entityConfig);
      const entitiesResponse: EntitiesResponse<BRCCatalog> =
        await getEntities(entityConfig);
      processEntityPaths(entityConfig, entitiesResponse, paths);
    }
  }

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps: GetStaticProps<
  EntityPageProps<BRCCatalog>
> = async ({ params }: GetStaticPropsContext) => {
  const appConfig = config();
  const { entities } = appConfig;
  const { entityListType, params: slug } = params || {};

  if (typeof entityListType !== "string") return { notFound: true };
  if (!Array.isArray(slug)) return { notFound: true };

  const entityConfig = getEntityConfig(entities, entityListType);
  const entityTab = getSlugPath(slug, PARAMS_INDEX_TAB);
  const entityId = getSlugPath(slug, PARAMS_INDEX_UUID);

  if (!entityConfig || !entityId) return { notFound: true };

  const props: EntityPageProps<BRCCatalog> = { entityListType };

  // Process entity props.
  await processEntityProps(entityConfig, entityTab, entityId, props);

  return {
    props,
  };
};

export default EntityDetailPage;

/**
 * Fetches entities response for the given entity config.
 * @param entityConfig - Entity config.
 * @returns entities response.
 */
async function getEntities<R>(
  entityConfig: EntityConfig
): Promise<EntitiesResponse<R>> {
  const { fetchAllEntities, path } = getEntityService(entityConfig, undefined);
  return await fetchAllEntities(path, undefined, undefined, undefined);
}

/**
 * Fetches the entity for the given entity ID.
 * @param entityConfig - Entity config.
 * @param entityId - Entity ID.
 * @returns entity response.
 */
async function getEntity<R>(
  entityConfig: EntityConfig,
  entityId: string
): Promise<R> {
  const { fetchEntityDetail, path } = getEntityService(entityConfig, undefined);
  return await fetchEntityDetail(
    entityId,
    path,
    undefined,
    undefined,
    undefined,
    true
  );
}

/**
 * Returns the slug path for the given slug and slug index.
 * @param slug - Slug.
 * @param slugIndex - Slug index.
 * @returns path.
 */
function getSlugPath(slug: string[], slugIndex: number): string | undefined {
  return slug[slugIndex];
}

/**
 * Returns the list of tab routes for the given tab config.
 * @param tabs - Tab config.
 * @returns tab routes.
 */
function getTabRoutes(tabs: BackPageTabConfig[]): string[] {
  return tabs.map(({ route }) => route) ?? [];
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
  paths: StaticPath[]
): void {
  const { detail, route: entityListType } = entityConfig;
  const { tabs } = detail;
  const { hits: entities } = entitiesResponse;
  const tabRoutes = getTabRoutes(tabs);
  for (const entity of entities) {
    const entityId = entityConfig.getId?.(entity);
    if (!entityId) continue;
    // Skip the entity if it has already been processed.
    if (setOfProcessedIds.has(entityId)) continue;
    setOfProcessedIds.add(entityId);
    // Generate a path for each entity and each tab.
    for (const tabRoute of tabRoutes) {
      const params = [entityId, tabRoute];
      paths.push({
        params: {
          entityListType,
          params,
        },
      });
    }
  }
}

/**
 * Processes the entity props for the given entity page.
 * @param entityConfig - Entity config.
 * @param entityTab - Entity tab.
 * @param entityId - Entity ID.
 * @param props - Entity detail page props.
 */
async function processEntityProps<R>(
  entityConfig: EntityConfig,
  entityTab = "",
  entityId: string,
  props: EntityPageProps<R>
): Promise<void> {
  const {
    detail: { staticLoad },
    exploreMode,
  } = entityConfig;
  // Early exit; return if the entity is not to be statically loaded.
  if (!staticLoad) return;
  // When the entity detail is to be fetched from API, we only do so for the first tab.
  if (exploreMode === EXPLORE_MODE.SS_FETCH_SS_FILTERING && entityTab) return;
  if (exploreMode === EXPLORE_MODE.CS_FETCH_CS_FILTERING) {
    // Seed database.
    await seedDatabase(entityConfig.route, entityConfig);
  }
  // Fetch entity detail, either from database or API.
  const entityResponse = (await getEntity(entityConfig, entityId)) as R;
  if (entityResponse) {
    props.data = entityResponse;
  }
}
