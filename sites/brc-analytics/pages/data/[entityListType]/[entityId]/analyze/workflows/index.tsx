import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { AnalyzeWorkflowsView } from "@/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { getEntities } from "@brc-analytics/core/services/staticGeneration/entities/utils";
import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import { config } from "@site-config/brc-analytics/config";
import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props {
  entityId: string;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

/**
 * Analyze Workflows view page.
 * @param props - Page props.
 * @returns Analyze Workflows view component.
 */
const Page = (props: Props): JSX.Element => {
  return (
    <EntityDataGate>
      <AnalyzeWorkflowsView entityId={props.entityId} />
    </EntityDataGate>
  );
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths: GetStaticPathsResult<Params>["paths"] = [];

  for (const entityConfig of config().entities) {
    const { route: entityListType } = entityConfig;

    // Only statically generate paths for assemblies.
    if (entityListType !== "assemblies") continue;

    await seedDatabase(entityListType, entityConfig);

    const entities = await getEntities(entityConfig);

    for (const entity of entities.hits) {
      const entityId = entityConfig.getId?.(entity);

      if (!entityId) continue;

      paths.push({ params: { entityId, entityListType } });
    }
  }

  return { fallback: false, paths };
};

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: GetStaticPropsContext) => {
  const { entityId, entityListType } = params as Params;

  if (!entityId || !entityListType) return { notFound: true };

  return {
    props: {
      entityId,
      entityListType,
      ...BRC_PAGE_META.ANALYZE_WORKFLOWS,
    },
  };
};

export default Page;
