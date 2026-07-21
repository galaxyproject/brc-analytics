import { getEntityListMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { EntitiesView } from "@/views/EntitiesView/entitiesView";
import type { Props as EntitiesPageProps } from "@/views/EntitiesView/types";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

interface Params extends ParsedUrlQuery {
  entityListType: string;
}

/**
 * Explore view page for client-side loaded entity lists (assemblies, organisms).
 * @param props - Page props.
 * @param props.entityListType - Entity list type.
 * @returns EntitiesView component.
 */
const Page = ({ entityListType, ...props }: EntitiesPageProps): JSX.Element => {
  if (!entityListType) return <></>;

  return <EntitiesView entityListType={entityListType} {...props} />;
};

/**
 * Build the list of paths to be built statically.
 * @returns static paths.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const appConfig = config();
  const entities = appConfig.entities;
  const paths = entities
    // Workflows has no explore list page; priority-pathogens has its own page.
    .filter(
      (entity) =>
        entity.route !== "workflows" && entity.route !== "priority-pathogens"
    )
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
export const getStaticProps: GetStaticProps<EntitiesPageProps> = async (
  context: GetStaticPropsContext
) => {
  const appConfig = config();
  const { entityListType } = context.params as Params;
  const entityMeta = getEntityListMeta(appConfig.appKey)[entityListType];

  return {
    props: {
      entityListType,
      pageDescription: entityMeta?.pageDescription,
      pageTitle: entityMeta?.pageTitle,
    },
  };
};

Page.Main = DXMain;

export default Page;
