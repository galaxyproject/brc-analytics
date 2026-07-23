import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { ENTITY_KEYS } from "@/providers/workflowHandoff/constants";
import type { EntityKey } from "@/providers/workflowHandoff/types";
import { getEntities } from "@/utils/entityUtils";
import { seedDatabase } from "@/utils/seedDatabase";
import { AnalyzeWorkflowsRouteView } from "@/views/AnalyzeWorkflowsRouteView/analyzeWorkflowsRouteView";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import type {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import type { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props {
  entityId: string;
  entityListType: EntityKey;
  pageDescription?: string;
  pageTitle?: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths: GetStaticPathsResult<Params>["paths"] = [];

  for (const entityConfig of config().entities) {
    const { route: entityListType } = entityConfig;

    // Statically generate a single base path per assembly and per organism; the
    // selected workflow is carried at runtime as a `trsId` query param.
    if (
      entityListType !== ENTITY_KEYS.ASSEMBLIES &&
      entityListType !== ENTITY_KEYS.ORGANISMS
    )
      continue;

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
      // getStaticPaths only emits assembly/organism paths, so this is an EntityKey.
      entityListType: entityListType as EntityKey,
      ...pageMeta,
    },
  };
};

/**
 * Analyze workflows page.
 * @param props - Page props.
 * @param props.entityId - Entity ID.
 * @param props.entityListType - Entity list type.
 * @returns Analyze workflows route view.
 */
const Page = ({ entityId, entityListType }: Props): JSX.Element => (
  <EntityDataGate>
    <AnalyzeWorkflowsRouteView
      entityId={entityId}
      entityListType={entityListType}
    />
  </EntityDataGate>
);

export default Page;
