import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import {
  BRCCatalog,
  EntitiesResponse,
} from "../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2Catalog } from "../../../../app/apis/catalog/ga2/entities";
import { BRC_PAGE_META } from "../../../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../../../app/common/meta/ga2/constants";
import { config } from "../../../../app/config/config";
import { APP_KEYS } from "../../../../site-config/common/constants";
import { getEntities, getEntity } from "../../../../app/utils/entityUtils";
import { seedDatabase } from "../../../../app/utils/seedDatabase";
import { AnalyzeView } from "../../../../app/views/AnalyzeView/analyzeView";
import { EntityDetailView } from "../../../../app/views/EntityView/entityView";

interface StaticPath {
  params: PageUrl;
}

interface PageUrl extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface EntityPageProps<R> {
  data?: R;
  entityId: string;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

function getEntityDetailMeta(
  appKey?: string
): Record<string, { pageDescription: string; pageTitle: string }> {
  const meta = appKey === APP_KEYS.GA2 ? GA2_PAGE_META : BRC_PAGE_META;
  return {
    assemblies: meta.ASSEMBLY_DETAIL,
    organisms: meta.ORGANISM_DETAIL,
    ...("PRIORITY_PATHOGEN_DETAIL" in meta
      ? { "priority-pathogens": meta.PRIORITY_PATHOGEN_DETAIL }
      : {}),
  };
}

/**
 * Entity detail view page.
 * @param props - Entity detail view page props.
 * @returns Entity detail view component.
 */
const EntityDetailPage = <R,>(props: EntityPageProps<R>): JSX.Element => {
  if (props.entityListType === "assemblies")
    return <AnalyzeView entityId={props.entityId} />;
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
    const { route: entityListType } = entityConfig;

    if (entityListType === "workflows") continue;

    await seedDatabase(entityListType, entityConfig);
    const entitiesResponse: EntitiesResponse<BRCCatalog | GA2Catalog> =
      await getEntities(entityConfig);
    processEntityPaths(entityConfig, entitiesResponse, paths);
  }

  return {
    fallback: false,
    paths,
  };
};

/**
 * getStaticProps - return the entity data for the given entity type and entity ID.
 * @param context - GetStaticPropsContext.
 * @param context.params - Entity type and entity ID.
 * @returns Promise<GetStaticPropsContext<PageUrl>>.
 */
export const getStaticProps: GetStaticProps<
  EntityPageProps<BRCCatalog | GA2Catalog>
> = async ({ params }: GetStaticPropsContext) => {
  const appConfig = config();
  const { entities } = appConfig;

  const validationResult = validateParams(params);
  if (validationResult) return validationResult;

  // At this point, we know entityListType and entityId are valid strings
  const { entityId, entityListType } = params as {
    entityId: string;
    entityListType: string;
  };

  const entityConfig = getEntityConfig(entities, entityListType);
  const entityMeta = getEntityDetailMeta(appConfig.appKey)[entityListType];

  const props: EntityPageProps<BRCCatalog | GA2Catalog> = {
    entityId,
    entityListType,
    pageDescription: entityMeta?.pageDescription,
    pageTitle: entityMeta?.pageTitle,
  };

  // Process entity props.
  await processEntityProps(entityConfig, entityId, props);

  return {
    props,
  };
};

export default EntityDetailPage;

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

/**
 * Processes the entity props for the given entity page.
 * @param entityConfig - Entity config.
 * @param entityId - Entity ID.
 * @param props - Entity detail page props.
 */
async function processEntityProps<R>(
  entityConfig: EntityConfig,
  entityId: string,
  props: EntityPageProps<R>
): Promise<void> {
  const {
    detail: { staticLoad },
  } = entityConfig;
  // Early exit; return if the entity is not to be statically loaded.
  if (!staticLoad) return;
  // Seed database.
  await seedDatabase(entityConfig.route, entityConfig);
  // Fetch entity detail from database.
  const entityResponse = (await getEntity(entityConfig, entityId)) as R;
  if (entityResponse) {
    props.data = entityResponse;
  }
}

/**
 * Validates that entityListType and entityId parameters are strings.
 * @param params - The entity list type and ID parameters from the URL.
 * @returns Object with notFound: true if validation fails, null otherwise.
 */
function validateParams(
  params: ParsedUrlQuery | undefined
): { notFound: true } | null {
  if (!params) return { notFound: true };
  const { entityId, entityListType } = params;
  if (typeof entityListType !== "string") return { notFound: true };
  if (typeof entityId !== "string") return { notFound: true };
  return null;
}
