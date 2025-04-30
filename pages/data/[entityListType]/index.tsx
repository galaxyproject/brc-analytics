import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import {
  BRCCatalog,
  EntitiesResponse,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { config } from "../../../app/config/config";
import { seedDatabase } from "../../../app/utils/seedDatabase";
import { StyledExploreView } from "../../../app/views/ExploreView/exploreView.styles";

interface PageUrl extends ParsedUrlQuery {
  entityListType: string;
}

interface EntitiesPageProps<R> {
  data?: EntitiesResponse<R>;
  entityListType: string;
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
  return <StyledExploreView entityListType={entityListType} {...props} />;
};

/**
 * Build the list of paths to be built statically.
 * @returns static paths.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const appConfig = config();
  const entities = appConfig.entities;
  const paths = entities.map((entity) => ({
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
  EntitiesPageProps<BRCCatalog>
> = async (context: GetStaticPropsContext) => {
  const appConfig = config();
  const { entityListType } = context.params as PageUrl;
  const { entities } = appConfig;
  const entityConfig = getEntityConfig(entities, entityListType);
  const { exploreMode } = entityConfig;
  const { fetchAllEntities } = getEntityService(entityConfig, undefined); // Determine the type of fetch, either from an API endpoint or a TSV.

  const props: EntitiesPageProps<BRCCatalog> = { entityListType };

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
