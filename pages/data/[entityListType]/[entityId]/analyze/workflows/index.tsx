import { getPageMeta } from "@/common/meta/utils";
import { EntityDataGate } from "@/components/EntityDataGate/entityDataGate";
import { config } from "@/config/config";
import { getEntities } from "@/utils/entityUtils";
import { AnalyzeWorkflowsView } from "@/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
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

  const pageMeta = getPageMeta(config().appKey).ANALYZE_WORKFLOWS;

  return {
    props: {
      entityId,
      entityListType,
      ...pageMeta,
    },
  };
};

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

export default Page;
