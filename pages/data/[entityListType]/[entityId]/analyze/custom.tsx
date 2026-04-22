import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../../../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../../../../app/common/meta/ga2/constants";
import { config } from "../../../../../app/config/config";
import { APP_KEYS } from "../../../../../site-config/common/constants";
import { getEntities } from "../../../../../app/utils/entityUtils";
import { seedDatabase } from "../../../../../app/utils/seedDatabase";
import { CUSTOM_WORKFLOW } from "../../../../../app/views/AnalyzeWorkflowsView/custom/constants";
import { WorkflowInputsView } from "../../../../../app/views/WorkflowInputsView/workflowInputsView";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props {
  entityId: string;
  pageDescription?: string;
  pageTitle?: string;
  trsId: string;
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

  // Pass the custom workflow TRS ID as a prop to the page, so that the correct workflow is loaded in the WorkflowInputsView.
  return {
    props: {
      entityId,
      ...(config().appKey === APP_KEYS.GA2
        ? GA2_PAGE_META.CUSTOM_WORKFLOW
        : BRC_PAGE_META.CUSTOM_WORKFLOW),
      trsId: CUSTOM_WORKFLOW.trsId,
    },
  };
};

/**
 * Custom workflow view page.
 * @param props - Page props.
 * @returns Custom workflow view component.
 */
const Page = (props: Props): JSX.Element => {
  return <WorkflowInputsView {...props} />;
};

export default Page;
