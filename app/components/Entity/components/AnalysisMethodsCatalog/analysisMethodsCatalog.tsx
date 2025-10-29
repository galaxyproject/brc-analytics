import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { CustomWorkflow } from "../AnalysisMethod/components/CustomWorkflow/customWorkflow";
import { AnalysisTypeHeader } from "./components/AnalysisTypeHeader/analysisTypeHeader";
import { Stack } from "@mui/material";
import { buildAssemblyWorkflows } from "./utils";
import WORKFLOW_CATEGORIES from "../../../../../catalog/output/workflows.json";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  const workflowCategories = buildAssemblyWorkflows(
    assembly,
    WORKFLOW_CATEGORIES
  );
  const isFeatureEnabled = useFeatureFlag("custom-workflow");

  const {
    query: { entityId },
  } = useRouter();

  return (
    <Stack gap={8} useFlexGap>
      {/* Custom Analysis */}
      {isFeatureEnabled && (
        <Stack gap={4} useFlexGap>
          <AnalysisTypeHeader
            description="Prefer to explore the data without a predefined workflow?"
            title="Custom Analysis"
          />
          <CustomWorkflow entityId={entityId as string} />
        </Stack>
      )}
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
        {workflowCategories.map((workflowCategory, i) => {
          return (
            <AnalysisMethod
              defaultExpanded={i === 0 && workflowCategory.workflows.length > 0}
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
