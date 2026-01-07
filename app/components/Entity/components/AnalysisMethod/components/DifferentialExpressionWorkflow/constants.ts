import { WORKFLOW_PLOIDY } from "../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export const DIFFERENTIAL_EXPRESSION_WORKFLOW: Workflow = {
  iwcId: "",
  parameters: [],
  ploidy: WORKFLOW_PLOIDY.ANY,
  taxonomyId: null,
  trsId: "differential-expression-workflow",
  workflowDescription:
    "Analyze differential gene expression from raw reads to DE results.",
  workflowName: "Differential Expression Workflow",
};
