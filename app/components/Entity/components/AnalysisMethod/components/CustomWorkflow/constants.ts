import {
  WORKFLOW_PLOIDY,
  WORKFLOW_PARAMETER_VARIABLE,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export const CUSTOM_WORKFLOW: Workflow = {
  iwcId: "",
  parameters: [
    {
      key: "Reference annotation",
      variable: WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL,
    },
  ],
  ploidy: WORKFLOW_PLOIDY.ANY,
  taxonomyId: null,
  trsId: "custom-workflow",
  workflowDescription:
    "Select reads and tracks to send to a new Galaxy history with this assembly to analyze with your own tools or workflows.",
  workflowName: "Custom Analysis",
};
