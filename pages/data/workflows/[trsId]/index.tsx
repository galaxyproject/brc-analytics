import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../../../app/common/meta/brc/constants";
import { formatTrsId } from "../../../../app/views/AnalyzeWorkflowsView/components/Main/utils";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../app/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { LEXICMAP } from "../../../../app/views/AnalyzeWorkflowsView/lexicmap/constants";
import { LOGAN_SEARCH } from "../../../../app/views/AnalyzeWorkflowsView/loganSearch/constants";
import { WorkflowView } from "../../../../app/views/WorkflowView/workflowView";
import workflowCategories from "../../../../catalog/output/workflows.json";

interface Params extends ParsedUrlQuery {
  trsId: string;
}

export interface Props {
  pageDescription?: string;
  pageTitle?: string;
  trsId: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = workflowCategories.reduce(
    (acc, { workflows }) => {
      for (const { trsId } of workflows) {
        acc.push({ params: { trsId: formatTrsId(trsId) } });
      }
      return acc;
    },
    [] as { params: Params }[]
  );

  // Add Differential Expression Analysis workflow (interim measure).
  paths.push({
    params: { trsId: formatTrsId(DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId) },
  });

  // Add LMLS workflows (Logan Search and Lexicmap).
  paths.push({
    params: { trsId: formatTrsId(LOGAN_SEARCH.trsId) },
  });
  paths.push({
    params: { trsId: formatTrsId(LEXICMAP.trsId) },
  });

  return { fallback: false, paths };
};

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: GetStaticPropsContext) => {
  const { trsId } = params as Params;

  if (!trsId) return { notFound: true };

  return {
    props: {
      ...BRC_PAGE_META.WORKFLOW,
      trsId,
    },
  };
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
