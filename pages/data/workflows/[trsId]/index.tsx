import { JSX } from "react";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import workflowCategories from "../../../../catalog/output/workflows.json";
import { formatTrsId } from "../../../../app/components/Entity/components/AnalysisMethodsCatalog/utils";
import { WorkflowView } from "../../../../app/views/WorkflowView/workflowView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import Error from "next/error";

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
  const isWorkflowsEnabled = useFeatureFlag("workflows");

  // Throw an error if the workflows feature is not enabled.
  if (!isWorkflowsEnabled) return <Error statusCode={404} />;

  return <WorkflowView {...props} />;
};

export default Page;
