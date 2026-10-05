import {
  WORKFLOW_CATEGORY_ID,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import type { Workflow } from "@repo/shared/apis/workflow";

/**
 * The catalog category Differential Expression Analysis is listed under. The
 * workflow is not in the catalog, so the listings add it to this category and
 * gate it as a member of it, the same as the category's own workflows.
 */
export const DIFFERENTIAL_EXPRESSION_ANALYSIS_CATEGORY =
  WORKFLOW_CATEGORY_ID.TRANSCRIPTOMICS;

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
