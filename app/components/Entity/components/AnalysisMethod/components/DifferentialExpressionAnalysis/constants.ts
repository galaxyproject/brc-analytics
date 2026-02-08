import { WORKFLOW_PLOIDY } from "../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export const DIFFERENTIAL_EXPRESSION_ANALYSIS: Workflow = {
  iwcId: "",
  parameters: [],
  ploidy: WORKFLOW_PLOIDY.ANY,
  taxonomyId: null,
  trsId: "differential-expression-analysis",
  workflowDescription:
    "Run end-to-end differential expression analysis by combining RNA-seq quantification with DESeq2. Upload your sample sheet, configure the experimental design, and launch the workflow in Galaxy.",
  workflowId: "f0e86e1b05fe73d9", // Galaxy stored workflow ID
  workflowName: "Differential Expression Analysis",
};
