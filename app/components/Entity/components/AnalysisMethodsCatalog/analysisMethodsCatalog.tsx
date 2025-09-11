import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowIsCompatibleWithAssembly } from "./utils";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { CustomWorkflow } from "../AnalysisMethod/components/CustomWorkflow/customWorkflow";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  const isFeatureEnabled = useFeatureFlag("custom-workflow");

  const {
    query: { entityId },
  } = useRouter();

  return (
    <Fragment>
      {isFeatureEnabled && <CustomWorkflow entityId={entityId as string} />}
      {workflows.map((workflowCategory) => {
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
            entityId={entityId as string}
            geneModelUrl={assembly.geneModelUrl}
            genomeVersionAssemblyId={assembly.accession}
            key={workflowCategory.category}
            workflows={compatibleWorkflows}
            workflowCategory={workflowCategory}
          />
        );
      })}
    </Fragment>
  );
};
