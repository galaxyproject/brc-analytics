import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { formatTrsId } from "@/views/AnalyzeWorkflowsView/components/Main/utils";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { WorkflowView } from "@/views/WorkflowView/workflowView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import ga2WorkflowMappings from "catalog/ga2/output/workflow-assembly-mappings.json";
import workflowCategories from "catalog/output/workflows.json";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

interface Params extends ParsedUrlQuery {
  trsId: string;
}

export interface Props {
  pageDescription?: string;
  pageTitle?: string;
  trsId: string;
}

// TRS IDs of the workflows GA2 actually offers (mapped to GA2 assemblies). The
// workflow definitions are shared (catalog/output/workflows.json), so filter to
// GA2's own mappings and skip any workflow not offered on this site.
const GA2_WORKFLOW_TRS_IDS = new Set(
  ga2WorkflowMappings.map((mapping) => mapping.workflowTrsId)
);

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = workflowCategories.reduce(
    (acc, { workflows }) => {
      for (const { trsId } of workflows) {
        if (!GA2_WORKFLOW_TRS_IDS.has(trsId)) continue;
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

  // Note: LMLS (Logan Search / Lexicmap) paths are intentionally omitted — GA2 does
  // not offer those workflows (no lmls feature flag; no GA2 assembly mappings).

  return { fallback: false, paths };
};

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: GetStaticPropsContext) => {
  const { trsId } = params as Params;

  if (!trsId) return { notFound: true };

  return {
    props: {
      ...GA2_PAGE_META.WORKFLOW,
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
  return (
    <EntityDataGate>
      <WorkflowView {...props} />
    </EntityDataGate>
  );
};

export default Page;
