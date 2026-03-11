import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import { formatTrsId } from "../../../../app/components/Entity/components/AnalysisMethodsCatalog/utils";
import { config } from "../../../../app/config/config";
import { WorkflowView } from "../../../../app/views/WorkflowView/workflowView";
import workflowCategories from "../../../../catalog/output/workflows.json";
import { APP_KEYS } from "../../../../site-config/common/constants";

interface Params extends ParsedUrlQuery {
  trsId: string;
}

export interface Props {
  trsId: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = workflowCategories.reduce(
    (acc, { showComingSoon, workflows }) => {
      // Special case, "showComingSoon", when false, should be skipped.
      if (showComingSoon === false) return acc;
      for (const { trsId } of workflows) {
        acc.push({ params: { trsId: formatTrsId(trsId) } });
      }
      return acc;
    },
    [] as { params: Params }[]
  );

  return { fallback: false, paths };
};

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: GetStaticPropsContext) => {
  if (config().appKey === APP_KEYS.GA2) return { notFound: true };

  const { trsId } = params as Params;

  if (!trsId) return { notFound: true };

  return { props: { trsId } };
};

/**
 * Workflow view page.
 * @param props - Page props.
 * @returns Workflow view component.
 */
const Page = (props: Props): JSX.Element => {
  return <WorkflowView {...props} />;
};

export default Page;
