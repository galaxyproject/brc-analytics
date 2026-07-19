import {
  BRCCatalog,
  Outbreak,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { config } from "@/config/config";
import { PriorityPathogensView } from "@/views/PriorityPathogensView/priorityPathogensView";
import { EntitiesResponse } from "@brc-analytics/core/services/staticGeneration/entities/types";
import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import { StyledExploreView } from "@brc-analytics/core/views/ExploreView/exploreView.styles";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { EXPLORE_MODE } from "@databiosphere/findable-ui/lib/hooks/useExploreMode/types";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

interface Params extends ParsedUrlQuery {
  entityListType: string;
}

interface Props<R> {
  data?: EntitiesResponse<R>;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

// BRC list-route page metadata.
const ENTITY_LIST_META: Record<
  string,
  { pageDescription: string; pageTitle: string }
> = {
  assemblies: BRC_PAGE_META.ASSEMBLIES,
  organisms: BRC_PAGE_META.ORGANISMS,
  "priority-pathogens": BRC_PAGE_META.PRIORITY_PATHOGENS,
};

/**
 * Explore view page.
 * @param props - Explore view page props.
 * @param props.entityListType - Entity list type.
 * @returns ExploreView component.
 */
const Page = <R,>({ entityListType, ...props }: Props<R>): JSX.Element => {
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
export const getStaticProps: GetStaticProps<Props<BRCCatalog>> = async (
  context: GetStaticPropsContext
) => {
  const appConfig = config();
  const { entityListType } = context.params as Params;
  const { entities } = appConfig;
  const entityConfig = getEntityConfig(entities, entityListType);
  const { exploreMode } = entityConfig;
  const { fetchAllEntities } = getEntityService(entityConfig, undefined); // Determine the type of fetch, either from an API endpoint or a TSV.

  const entityMeta = ENTITY_LIST_META[entityListType];

  const props: Props<BRCCatalog> = {
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

  // Entities are client-side fetched from a local database seeded from a configured JSON.
  props.data = await fetchAllEntities(entityListType, undefined);

  return { props };
};

export default Page;

Page.Main = DXMain;
