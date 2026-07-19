import { GA2Catalog } from "@/apis/catalog/ga2/entities";
import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { config } from "@/config/config";
import { AnalyzeView } from "@/views/AnalyzeView/analyzeView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import {
  makeEntityStaticPaths,
  makeEntityStaticProps,
} from "@brc-analytics/core/services/staticGeneration/entity/entity";
import { EntityPageProps } from "@brc-analytics/core/services/staticGeneration/entity/types";
import { EntityDetailView } from "@brc-analytics/core/views/EntityView/entityView";
import { JSX } from "react";

// GA2 detail-route page metadata.
const ENTITY_DETAIL_META = {
  assemblies: GA2_PAGE_META.ASSEMBLY_DETAIL,
  organisms: GA2_PAGE_META.ORGANISM_DETAIL,
};

/**
 * Entity detail view page.
 * @param props - Entity detail view page props.
 * @returns Entity detail view component.
 */
const Page = (props: EntityPageProps<unknown>): JSX.Element => {
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

export const getStaticPaths = makeEntityStaticPaths(config);

export const getStaticProps = makeEntityStaticProps<GA2Catalog>(
  config,
  ENTITY_DETAIL_META
);

export default Page;
