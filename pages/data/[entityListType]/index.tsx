import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import {
  BRCCatalog,
  EntitiesResponse,
  Outbreak,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2Catalog } from "../../../app/apis/catalog/ga2/entities";
import { BRC_PAGE_META } from "../../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../../app/common/meta/ga2/constants";
import { config } from "../../../app/config/config";
import { APP_KEYS } from "../../../site-config/common/constants";
import { seedDatabase } from "../../../app/utils/seedDatabase";
import { StyledExploreView } from "../../../app/views/ExploreView/exploreView.styles";
import { PriorityPathogensView } from "../../../app/views/PriorityPathogensView/priorityPathogensView";

interface PageUrl extends ParsedUrlQuery {
  entityListType: string;
}

interface EntitiesPageProps<R> {
  data?: EntitiesResponse<R>;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

function getEntityListMeta(
  appKey?: string
): Record<string, { pageDescription: string; pageTitle: string }> {
  const meta = appKey === APP_KEYS.GA2 ? GA2_PAGE_META : BRC_PAGE_META;
  return {
    assemblies: meta.ASSEMBLIES,
    organisms: meta.ORGANISMS,
    ...("PRIORITY_PATHOGENS" in meta
      ? { "priority-pathogens": meta.PRIORITY_PATHOGENS }
      : {}),
  };
}

/**
 * Explore view page.
 * @param props - Explore view page props.
 * @param props.entityListType - Entity list type.
 * @returns ExploreView component.
 */
const IndexPage = <R,>({
  entityListType,
  ...props
}: EntitiesPageProps<R>): JSX.Element => {
  if (!entityListType) return <></>;

  // Return the PriorityPathogensView component for the priority pathogens route.
  if (entityListType === "priority-pathogens") {
    // Throw an error if no priority pathogen data is provided.
    if (!props.data) throw new Error("No priority pathogen data provided");

    // Return the PriorityPathogensView component.
    return (
      <PriorityPathogensView data={props.data as EntitiesResponse<Outbreak>} />
    );
  }

  // Return the ExploreView component for all other routes.
  return <StyledExploreView entityListType={entityListType} {...props} />;
};

/**
 * Build the list of paths to be built statically.
 * @returns static paths.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const appConfig = config();
  const entities = appConfig.entities;
  const paths = entities
    .filter((entity) => entity.route !== "workflows")
    .map((entity) => ({
      params: {
        entityListType: entity.route,
      },
    }));
  return {
    fallback: false,
    paths,
  };
};

/**
 * Build the set of props for pre-rendering of page.
 * @param context - Object containing values related to the current context.
 * @returns static props.
 */
export const getStaticProps: GetStaticProps<
  EntitiesPageProps<BRCCatalog | GA2Catalog>
> = async (context: GetStaticPropsContext) => {
  const appConfig = config();
  const { entityListType } = context.params as PageUrl;
  const { entities } = appConfig;
  const entityConfig = getEntityConfig(entities, entityListType);
  const { exploreMode } = entityConfig;
  const { fetchAllEntities } = getEntityService(entityConfig, undefined); // Determine the type of fetch, either from an API endpoint or a TSV.

  const entityMeta = getEntityListMeta(appConfig.appKey)[entityListType];

  const props: EntitiesPageProps<BRCCatalog | GA2Catalog> = {
    entityListType,
    pageDescription: entityMeta?.pageDescription,
    pageTitle: entityMeta?.pageTitle,
  };

  // Seed database.
  if (exploreMode === EXPLORE_MODE.CS_FETCH_CS_FILTERING) {
    await seedDatabase(entityListType, entityConfig);
  } else {
    // Entities are fetched server-side.
    return { props };
  }

  // Entities are client-side fetched from a local database seeded from a configured TSV.
  props.data = await fetchAllEntities(entityListType, undefined);

  return {
    props,
  };
};

IndexPage.Main = DXMain;

export default IndexPage;
