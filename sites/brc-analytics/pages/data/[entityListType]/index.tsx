import {
  BRCCatalog,
  Outbreak,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { PriorityPathogensView } from "@/views/PriorityPathogensView/priorityPathogensView";
import {
  makeEntitiesStaticPaths,
  makeEntitiesStaticProps,
} from "@brc-analytics/core/services/staticGeneration/entities/entities";
import {
  EntitiesPageProps,
  EntitiesResponse,
} from "@brc-analytics/core/services/staticGeneration/entities/types";
import { StyledExploreView } from "@brc-analytics/core/views/ExploreView/exploreView.styles";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { config } from "@site-config/brc-analytics/config";
import { JSX } from "react";

// BRC list-route page metadata.
const ENTITY_LIST_META = {
  assemblies: BRC_PAGE_META.ASSEMBLIES,
  organisms: BRC_PAGE_META.ORGANISMS,
  "priority-pathogens": BRC_PAGE_META.PRIORITY_PATHOGENS,
};

/**
 * Explore view page for BRC list routes.
 * @param props - Explore view page props.
 * @returns ExploreView (or PriorityPathogensView for the priority-pathogens route).
 */
const Page = (props: EntitiesPageProps<BRCCatalog>): JSX.Element => {
  if (!props.entityListType) return <></>;

  // Priority pathogens render a bespoke BRC view from the seeded list data.
  if (props.entityListType === "priority-pathogens") {
    // Throw an error if no priority pathogen data is provided.
    if (!props.data) throw new Error("No priority pathogen data provided");
    return (
      <PriorityPathogensView
        data={props.data as unknown as EntitiesResponse<Outbreak>}
      />
    );
  }

  // Return the ExploreView component for all other routes.
  return <StyledExploreView {...props} />;
};

export const getStaticPaths = makeEntitiesStaticPaths(config);

export const getStaticProps = makeEntitiesStaticProps<BRCCatalog>(
  config,
  ENTITY_LIST_META
);

export default Page;

Page.Main = DXMain;
