import { AnalysisMethods } from "../AnalysisMethods/analysisMethods";
import workflows from "../../../../../catalog/output/workflows.json";
import { AnalysisMethod } from "../AnalysisMethod/analysisMethod";
import { Props } from "./types";

const AVAILABLE_TRS_IDS = [
  "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/chipseq-pe/main/versions/v0.12",
  "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/rnaseq-pe/main/versions/v0.9",
  "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/haploid-variant-calling-wgs-pe/main/versions/v0.1",
];

export const AnalysisMethodsCatalog = ({
  geneModelUrl,
  genomeVersionAssemblyId,
}: Props): JSX.Element => {
  return (
    <AnalysisMethods>
      {workflows.map((workflowCategory) => {
        const availableWorkflows = workflowCategory.workflows.filter(
          ({ trsId }) => AVAILABLE_TRS_IDS.includes(trsId)
        );
        return (
          <AnalysisMethod
            key={workflowCategory.type}
            geneModelUrl={geneModelUrl}
            genomeVersionAssemblyId={genomeVersionAssemblyId}
            content={
              <>
                <h3>{workflowCategory.name}</h3>
                <p>{workflowCategory.description}</p>
              </>
            }
            workflowId={
              availableWorkflows.length === 0 ? "" : availableWorkflows[0].trsId
            }
          />
        );
      })}
    </AnalysisMethods>
  );
};
