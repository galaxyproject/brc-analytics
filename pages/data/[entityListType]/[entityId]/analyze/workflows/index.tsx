import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../../../../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../../../../../app/common/meta/ga2/constants";
import { config } from "../../../../../../app/config/config";
import { APP_KEYS } from "../../../../../../site-config/common/constants";
import { getEntities } from "../../../../../../app/utils/entityUtils";
import { seedDatabase } from "../../../../../../app/utils/seedDatabase";
import { AnalyzeWorkflowsView } from "../../../../../../app/views/AnalyzeWorkflowsView/analyzeWorkflowsView";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props {
  entityId: string;
  pageDescription?: string;
  pageTitle?: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths: GetStaticPathsResult<Params>["paths"] = [];

  for (const entityConfig of config().entities) {
    const { route: entityListType } = entityConfig;

    // Only statically generate paths for each assembly.
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
  const { entityId } = params as Params;

  if (!entityId) return { notFound: true };

  return {
    props: {
      entityId,
      ...(config().appKey === APP_KEYS.GA2
        ? GA2_PAGE_META.ANALYZE_WORKFLOWS
        : BRC_PAGE_META.ANALYZE_WORKFLOWS),
    },
  };
};

/**
 * Analyze Workflows view page.
 * @param props - Page props.
 * @returns Analyze Workflows view component.
 */
const Page = (props: Props): JSX.Element => {
  return <AnalyzeWorkflowsView entityId={props.entityId} />;
};

export default Page;
