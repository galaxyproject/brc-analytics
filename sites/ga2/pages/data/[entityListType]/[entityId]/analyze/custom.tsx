import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { config } from "@/config/config";
import { CUSTOM_WORKFLOW } from "@/views/AnalyzeWorkflowsView/custom/constants";
import { WorkflowInputsView } from "@/views/WorkflowInputsView/workflowInputsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import {
  makeCustomWorkflowStaticPaths,
  makeCustomWorkflowStaticProps,
} from "@brc-analytics/core/services/staticGeneration/customWorkflow/customWorkflow";
import { CustomWorkflowProps } from "@brc-analytics/core/services/staticGeneration/customWorkflow/types";
import { JSX } from "react";

/**
 * Custom workflow view page.
 * @param props - Page props.
 * @returns Custom workflow view component.
 */
const Page = (props: CustomWorkflowProps): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowInputsView {...props} />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeCustomWorkflowStaticPaths(config);

export const getStaticProps = makeCustomWorkflowStaticProps(
  CUSTOM_WORKFLOW.trsId,
  GA2_PAGE_META.CUSTOM_WORKFLOW
);

export default Page;
