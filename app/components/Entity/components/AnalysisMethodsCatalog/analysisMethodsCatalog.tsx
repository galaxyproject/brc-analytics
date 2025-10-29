import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowIsCompatibleWithAssembly } from "./utils";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { CustomWorkflow } from "../AnalysisMethod/components/CustomWorkflow/customWorkflow";
import { AnalysisTypeHeader } from "./components/AnalysisTypeHeader/analysisTypeHeader";
import { Stack } from "@mui/material";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
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
        {workflows.map((workflowCategory, i) => {
          const compatibleWorkflows = workflowCategory.workflows.filter(
            (workflow) => workflowIsCompatibleWithAssembly(workflow, assembly)
          );
          if (
            compatibleWorkflows.length === 0 &&
            !workflowCategory.showComingSoon
          ) {
            return null;
          }
          return (
            <AnalysisMethod
              defaultExpanded={i === 0}
              disabled={compatibleWorkflows.length === 0}
              entityId={entityId as string}
              geneModelUrl={assembly.geneModelUrl}
              genomeVersionAssemblyId={assembly.accession}
              key={workflowCategory.category}
              workflows={compatibleWorkflows}
              workflowCategory={workflowCategory}
            />
          );
        })}
      </Stack>
    </Stack>
  );
};
