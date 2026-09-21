import { BRC_PAGE_META } from "@brc/meta/constants";
import workflowCategories from "@catalog/output/workflows.json";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { isListedWorkflowAvailable } from "@repo/shared/components/workflow/WorkflowGate/utils";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { WorkflowNotFound } from "@repo/shared/components/workflow/WorkflowNotFound/workflowNotFound";
import { ROUTES } from "@repo/shared/routes/constants";
import { makeWorkflowStaticPaths } from "@repo/shared/services/staticGeneration/workflow/staticPaths";
import type {
  WorkflowPageParams,
  WorkflowPageProps,
} from "@repo/shared/services/staticGeneration/workflow/types";
import { WorkflowView } from "@repo/shared/views/WorkflowView/workflowView";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

/**
 * Workflow detail page. Every listable workflow is prerendered, whatever the
 * feature flags; the gate decides at render whether this one may be shown,
 * falling back to the unavailable state for a gated workflow.
 * @param props - Page props.
 * @returns Workflow detail page.
 */
const Page = (props: WorkflowPageProps): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowGate
        fallback={<WorkflowNotFound href={ROUTES.WORKFLOWS} />}
        isWorkflowAvailable={isListedWorkflowAvailable}
        trsId={props.trsId}
      >
        <WorkflowView {...props} />
      </WorkflowGate>
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
      ...BRC_PAGE_META.WORKFLOW,
      trsId: params.trsId,
    },
  };
};

export default Page;
