import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { WorkflowAccordion } from "../AnalysisMethod/components/WorkflowAccordion/workflowAccordion";
import { CUSTOM_WORKFLOW } from "../AnalysisMethod/components/CustomWorkflow/constants";
import { DIFFERENTIAL_EXPRESSION_WORKFLOW } from "../AnalysisMethod/components/DifferentialExpressionWorkflow/constants";
import { AnalysisTypeHeader } from "./components/AnalysisTypeHeader/analysisTypeHeader";
import { Stack } from "@mui/material";
import { buildAssemblyWorkflows } from "./utils";
import WORKFLOW_CATEGORIES from "../../../../../catalog/output/workflows.json";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  const workflowCategories = buildAssemblyWorkflows(
    assembly,
    WORKFLOW_CATEGORIES
  );

  const {
    query: { entityId },
  } = useRouter();

  const isDEEnabled = useFeatureFlag("de");

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
        {isDEEnabled && (
          <WorkflowAccordion
            buttonText="Configure Inputs"
            entityId={entityId as string}
            workflow={DIFFERENTIAL_EXPRESSION_WORKFLOW}
          />
        )}
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
