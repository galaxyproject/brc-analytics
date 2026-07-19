import { BRCCatalog } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { BRC_PAGE_META } from "@/common/meta/brc/constants";
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

// BRC detail-route page metadata.
const ENTITY_DETAIL_META = {
  assemblies: BRC_PAGE_META.ASSEMBLY_DETAIL,
  organisms: BRC_PAGE_META.ORGANISM_DETAIL,
  "priority-pathogens": BRC_PAGE_META.PRIORITY_PATHOGEN_DETAIL,
};

/**
 * Entity detail view page.
 * @param props - Entity detail view page props.
 * @returns Entity detail view component.
 */
const Page = (props: EntityPageProps<unknown>): JSX.Element => {
  // AnalyzeView reads from the workflows cache directly; EntityDetailView's
  // tab configs (e.g. OrganismView main column) also consume the cache via
  // getWorkflows(). Both branches need the cache before rendering.
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

export const getStaticProps = makeEntityStaticProps<BRCCatalog>(
  config,
  ENTITY_DETAIL_META
);

export default Page;
