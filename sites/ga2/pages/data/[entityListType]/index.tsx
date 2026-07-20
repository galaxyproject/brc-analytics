import { GA2Catalog } from "@/apis/catalog/ga2/entities";
import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import {
  makeEntitiesStaticPaths,
  makeEntitiesStaticProps,
} from "@brc-analytics/core/services/staticGeneration/entities/entities";
import { EntitiesPageProps } from "@brc-analytics/core/services/staticGeneration/entities/types";
import { StyledExploreView } from "@brc-analytics/core/views/ExploreView/exploreView.styles";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { config } from "@site-config/ga2/config";
import { JSX } from "react";

// GA2 list-route page metadata.
const ENTITY_LIST_META = {
  assemblies: GA2_PAGE_META.ASSEMBLIES,
  organisms: GA2_PAGE_META.ORGANISMS,
};

/**
 * Explore view page for GA2 list routes (organisms, genomes).
 * @param props - Explore view page props.
 * @returns ExploreView component.
 */
const Page = (props: EntitiesPageProps<GA2Catalog>): JSX.Element => {
  if (!props.entityListType) return <></>;
  return <StyledExploreView {...props} />;
};

export const getStaticPaths = makeEntitiesStaticPaths(config);

export const getStaticProps = makeEntitiesStaticProps<GA2Catalog>(
  config,
  ENTITY_LIST_META
);

export default Page;

Page.Main = DXMain;
