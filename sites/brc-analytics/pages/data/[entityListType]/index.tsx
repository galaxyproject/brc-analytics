import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { EntitiesView } from "@repo/shared/views/EntitiesView/entitiesView";
import type { Props as EntitiesPageProps } from "@repo/shared/views/EntitiesView/types";
import { type GetStaticPaths, type GetStaticProps } from "next";
import { type ParsedUrlQuery } from "querystring";
import { type JSX } from "react";

interface Params extends ParsedUrlQuery {
  entityListType: string;
}

const ENTITY_LIST_META: Record<
  string,
  { pageDescription: string; pageTitle: string }
> = {
  assemblies: BRC_PAGE_META.ASSEMBLIES,
  organisms: BRC_PAGE_META.ORGANISMS,
};

const Page = ({ entityListType, ...props }: EntitiesPageProps): JSX.Element => {
  if (!entityListType) return <></>;

  return (
    <EntityDataGate>
      <EntitiesView entityListType={entityListType} {...props} />
    </EntityDataGate>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Only entities with page metadata get an explore list page (workflows and
  // priority-pathogens have their own pages). Driving the paths off
  // ENTITY_LIST_META keeps them from drifting apart.
  const paths = config()
    .entities.filter((entity) => entity.route in ENTITY_LIST_META)
    .map((entity) => ({ params: { entityListType: entity.route } }));
  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps: GetStaticProps<
  EntitiesPageProps,
  Params
> = async ({ params }) => {
  if (!params?.entityListType) return { notFound: true };

  const entityMeta = ENTITY_LIST_META[params.entityListType];
  if (!entityMeta) return { notFound: true };

  return {
    props: {
      entityListType: params.entityListType,
      pageDescription: entityMeta.pageDescription,
      pageTitle: entityMeta.pageTitle,
    },
  };
};

export default Page;

Page.Main = DXMain;
