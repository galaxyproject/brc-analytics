import { Workflow } from "../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

export const DIFFERENTIAL_EXPRESSION_ANALYSIS: Workflow = {
  iwcId: "",
  parameters: [],
  ploidy: WORKFLOW_PLOIDY.ANY,
  scope: WORKFLOW_SCOPE.ASSEMBLY,
  taxonomyId: null,
  trsId: "differential-expression-analysis",
  workflowDescription:
    "Run end-to-end differential expression analysis by combining RNA-seq quantification with DESeq2. Upload your sample sheet, configure the experimental design, and launch the workflow in Galaxy.",
  workflowId:
    process.env.NEXT_PUBLIC_GALAXY_INSTANCE_URL === "https://usegalaxy.org"
      ? "7f8eb3a584e8080b"
      : "f0e86e1b05fe73d9", // Galaxy stored workflow ID
  workflowName: "Differential Expression Analysis",
};
