import { AnalysisMethods } from "../AnalysisMethods/analysisMethods";
import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowPloidyMatchesOrganismPloidy } from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import { ORGANISM_PLOIDY } from "../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { WorkflowCategory } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export const AnalysisMethodsCatalog = ({
  assemblyPloidy,
  geneModelUrl,
  genomeVersionAssemblyId,
}: Props): JSX.Element => {
  const compatibleWorkflows = getCompatibleWorkflows(assemblyPloidy);
  return (
    <AnalysisMethods>
      {compatibleWorkflows.length === 0
        ? "Not available"
        : compatibleWorkflows.map((workflowCategory) => {
            return (
              <AnalysisMethod
                key={workflowCategory.category}
                geneModelUrl={geneModelUrl}
                genomeVersionAssemblyId={genomeVersionAssemblyId}
                workflows={workflowCategory.workflows}
                workflowCategory={workflowCategory}
              />
            );
          })}
    </AnalysisMethods>
  );
};

function getCompatibleWorkflows(
  assemblyPloidy: ORGANISM_PLOIDY | null
): WorkflowCategory[] {
  if (assemblyPloidy === null) return [];

  const result: WorkflowCategory[] = [];

  for (const workflowCategory of workflows) {
    const categoryCompatibleWorkflows = workflowCategory.workflows.filter(
      ({ ploidy }) =>
        workflowPloidyMatchesOrganismPloidy(ploidy, assemblyPloidy)
    );
    if (categoryCompatibleWorkflows.length > 0)
      result.push({
        ...workflowCategory,
        workflows: categoryCompatibleWorkflows,
      });
  }

  return result;
}
