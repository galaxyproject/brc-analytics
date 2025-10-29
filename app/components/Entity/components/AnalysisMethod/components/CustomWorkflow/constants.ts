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
    "Send this assembly, its tracks, and ENA read runs to a new Galaxy history for analysis with your workflow.",
  workflowName: "Send Data to a Galaxy History",
};
