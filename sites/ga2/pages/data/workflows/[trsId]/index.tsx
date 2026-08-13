import workflowCategories from "@catalog/output/workflows.json";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeWorkflowStaticPaths } from "@repo/shared/services/staticGeneration/workflow/staticPaths";
import type {
  WorkflowPageParams,
  WorkflowPageProps,
} from "@repo/shared/services/staticGeneration/workflow/types";
import { WorkflowView } from "@repo/shared/views/WorkflowView/workflowView";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (props: WorkflowPageProps): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowView {...props} />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeWorkflowStaticPaths(workflowCategories);

export const getStaticProps: GetStaticProps<
  WorkflowPageProps,
  WorkflowPageParams
> = async ({ params }) => {
  if (!params?.trsId) return { notFound: true };

  return {
    props: {
      ...GA2_PAGE_META.WORKFLOW,
      trsId: params.trsId,
    },
  };
};

export default Page;
