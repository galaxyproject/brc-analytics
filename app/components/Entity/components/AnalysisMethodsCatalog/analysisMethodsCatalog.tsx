import { AnalysisMethods } from "../AnalysisMethods/analysisMethods";
import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowIsCompatibleWithAssembly } from "./utils";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { useRouter } from "next/router";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  const isFeatureEnabled = useFeatureFlag("workflow");
  const {
    query: { entityId },
  } = useRouter();
  return (
    <AnalysisMethods>
      {workflows.map((workflowCategory) => {
        const compatibleWorkflows = workflowCategory.workflows.filter(
          (workflow) => workflowIsCompatibleWithAssembly(workflow, assembly)
        );
        return (
          <AnalysisMethod
            entityId={entityId as string}
            key={workflowCategory.category}
            geneModelUrl={assembly.geneModelUrl}
            genomeVersionAssemblyId={assembly.accession}
            isFeatureEnabled={isFeatureEnabled}
            workflows={compatibleWorkflows}
            workflowCategory={workflowCategory}
          />
        );
      })}
    </AnalysisMethods>
  );
};
