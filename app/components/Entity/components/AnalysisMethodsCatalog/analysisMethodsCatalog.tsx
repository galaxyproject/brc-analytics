import { AnalysisMethods } from "../AnalysisMethods/analysisMethods";
import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";
import { workflowPloidyMatchesOrganismPloidy } from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "app/apis/catalog/brc-analytics-catalog/common/entities";

export const AnalysisMethodsCatalog = ({ assembly }: Props): JSX.Element => {
  return (
    <AnalysisMethods>
      {workflows.map((workflowCategory) => {
        const compatibleWorkflows = workflowCategory.workflows.filter(
          (workflow) => workflowIsCompatibleWithAssembly(workflow, assembly)
        );
        return (
          <AnalysisMethod
            key={workflowCategory.category}
            geneModelUrl={assembly.geneModelUrl}
            genomeVersionAssemblyId={assembly.accession}
            workflows={compatibleWorkflows}
            workflowCategory={workflowCategory}
          />
        );
      })}
    </AnalysisMethods>
  );
};

function workflowIsCompatibleWithAssembly(
  workflow: Workflow,
  assembly: BRCDataCatalogGenome
): boolean {
  if (
    workflow.taxonomyId !== null &&
    !assembly.lineageTaxonomyIds.includes(workflow.taxonomyId)
  ) {
    return false;
  }
  return assembly.ploidy.some((assemblyPloidy) =>
    workflowPloidyMatchesOrganismPloidy(workflow.ploidy, assemblyPloidy)
  );
}
