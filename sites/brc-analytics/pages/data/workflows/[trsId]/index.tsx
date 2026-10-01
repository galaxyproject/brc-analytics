import { BRC_PAGE_META } from "@brc/meta/constants";
import workflowCategories from "@catalog/output/workflows.json";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
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
 * Workflow detail page. The full catalog is prerendered; the gate decides at
 * render whether this workflow may be shown, falling back to the not-found
 * state for a stale, unknown or gated URL.
 * @param props - Page props.
 * @returns Workflow detail page.
 */
const Page = (props: WorkflowPageProps): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowGate
        fallback={<WorkflowNotFound href={ROUTES.WORKFLOWS} />}
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
