import { EntitiesResponse } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2Catalog } from "@/apis/catalog/ga2/entities";
import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { config } from "@/config/config";
import { getEntities, getEntity } from "@/utils/entityUtils";
import { AnalyzeView } from "@/views/AnalyzeView/analyzeView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import { EntityDetailView } from "@brc-analytics/core/views/EntityView/entityView";
import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props<R> {
  data?: R;
  entityId: string;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

// GA2 detail-route page metadata.
const ENTITY_DETAIL_META: Record<
  string,
  { pageDescription: string; pageTitle: string }
> = {
  assemblies: GA2_PAGE_META.ASSEMBLY_DETAIL,
  organisms: GA2_PAGE_META.ORGANISM_DETAIL,
};

/**
 * Entity detail view page.
 * @param props - Entity detail view page props.
 * @returns Entity detail view component.
 */
const Page = <R,>(props: Props<R>): JSX.Element => {
  // AnalyzeView reads from the workflows cache directly; EntityDetailView's
  // tab configs also consume the cache via getWorkflows(). Both branches need
  // the cache before rendering.
  if (props.entityListType === "assemblies") {
    return (
      <EntityDataGate>
        <AnalyzeView entityId={props.entityId} />
      </EntityDataGate>
    );
  }
  return (
    <EntityDataGate>
      <EntityDetailView {...props} />
    </EntityDataGate>
  );
};

/**
 * getStaticPaths - return the list of paths to prerender for each entity type and its tabs.
 * @returns Promise<GetStaticPaths<Params>>.
 */
export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const appConfig = config();
  const { entities } = appConfig;

  const paths: { params: Params }[] = [];

  for (const entityConfig of entities) {
    const { route: entityListType } = entityConfig;

    if (entityListType === "workflows") continue;

    await seedDatabase(entityListType, entityConfig);
    const entitiesResponse: EntitiesResponse<GA2Catalog> =
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
export const getStaticProps: GetStaticProps<Props<GA2Catalog>> = async ({
  params,
}: GetStaticPropsContext) => {
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
  const entityMeta = ENTITY_DETAIL_META[entityListType];

  const props: Props<GA2Catalog> = {
    entityId,
    entityListType,
    pageDescription: entityMeta?.pageDescription,
    pageTitle: entityMeta?.pageTitle,
  };

  // Process entity props.
  await processEntityProps(entityConfig, entityId, props);

  return { props };
};

export default Page;

/**
 * Processes the static paths for the given entity response.
 * @param entityConfig - Entity config.
 * @param entitiesResponse - Entities response.
 * @param paths - Static paths.
 */
function processEntityPaths<R>(
  entityConfig: EntityConfig,
  entitiesResponse: EntitiesResponse<R>,
  paths: { params: Params }[]
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
  props: Props<R>
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
