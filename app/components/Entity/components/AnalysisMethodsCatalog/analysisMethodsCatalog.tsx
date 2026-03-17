import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { Stack } from "@mui/material";
import { useRouter } from "next/router";
import { Fragment, JSX } from "react";
import WORKFLOW_CATEGORIES from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { CUSTOM_WORKFLOW } from "../AnalysisMethod/components/CustomWorkflow/constants";
import { WorkflowAccordion } from "../AnalysisMethod/components/WorkflowAccordion/workflowAccordion";
import { AnalysisTypeHeader } from "./components/AnalysisTypeHeader/analysisTypeHeader";
import { Props } from "./types";
import { buildAssemblyWorkflows } from "./utils";

/**
 * AnalysisMethodsCatalog component - displays the available analysis methods for a given assembly.
 * @deprecated - Separate out custom workflow from predefined workflows.
 * @param props - Props for the AnalysisMethodsCatalog component.
 * @param props.assembly - Assembly.
 * @returns JSX.Element - The rendered AnalysisMethodsCatalog component.
 */
export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  const isDEEnabled = useFeatureFlag("de");
  const workflowCategories = buildAssemblyWorkflows(
    assembly,
    WORKFLOW_CATEGORIES,
    isDEEnabled
  );

  const {
    query: { entityId },
  } = useRouter();

  return (
    <Stack gap={8} useFlexGap>
      {/* Custom Analysis */}
      <Stack gap={4} useFlexGap>
        <AnalysisTypeHeader
          description="Prefer to explore the data without a predefined workflow?"
          title="Custom Analysis"
        />
        <WorkflowAccordion
          entityId={entityId as string}
          workflow={CUSTOM_WORKFLOW}
        />
      </Stack>
      <Stack gap={4} useFlexGap>
        {/* Workflow Analysis */}
        <AnalysisTypeHeader
          description={
            <Fragment>
              <div>
                Select an analysis workflow to run in Galaxy using this assembly
                as your reference.
              </div>
              <div>
                You can include sequencing reads from ENA and genome tracks from
                the UCSC Genome Browser.
              </div>
              <div>
                When you launch the analysis, a new Galaxy history will be
                created containing the selected assembly and data.
              </div>
            </Fragment>
          }
          title="Select a Workflow"
        />
        {workflowCategories.map((workflowCategory) => {
          return (
            <AnalysisMethod
              disabled={workflowCategory.workflows.length === 0}
              entityId={entityId as string}
              geneModelUrl={assembly.geneModelUrl}
              genomeVersionAssemblyId={assembly.accession}
              key={workflowCategory.category}
              workflows={workflowCategory.workflows}
              workflowCategory={workflowCategory}
            />
          );
        })}
      </Stack>
    </Stack>
  );
};
