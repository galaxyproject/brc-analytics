import { AnalysisMethods } from "../AnalysisMethods/analysisMethods";
import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowPloidyMatchesOrganismPloidy } from "../../../../apis/catalog/brc-analytics-catalog/common/utils";

export const AnalysisMethodsCatalog = ({
  assemblyPloidies,
  geneModelUrl,
  genomeVersionAssemblyId,
}: Props): JSX.Element => {
  return (
    <AnalysisMethods>
      {workflows.map((workflowCategory) => {
        const compatibleWorkflows = workflowCategory.workflows.filter(
          ({ ploidy }) =>
            assemblyPloidies.some((assemblyPloidy) =>
              workflowPloidyMatchesOrganismPloidy(ploidy, assemblyPloidy)
            )
        );
        return (
          <AnalysisMethod
            key={workflowCategory.category}
            geneModelUrl={geneModelUrl}
            genomeVersionAssemblyId={genomeVersionAssemblyId}
            workflows={compatibleWorkflows}
            workflowCategory={workflowCategory}
          />
        );
      })}
    </AnalysisMethods>
  );
};
