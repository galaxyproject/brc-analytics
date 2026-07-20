import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@brc-analytics/core/apis/schema-types";
import type { Workflow } from "@brc-analytics/core/apis/workflow";

export const DIFFERENTIAL_EXPRESSION_ANALYSIS: Workflow = {
  assemblyCountMax: 1,
  assemblyCountMin: 1,
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
