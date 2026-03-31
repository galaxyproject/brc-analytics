import { Workflow } from "../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
} from "../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

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
    "Send this assembly, related UCSC Browser tracks, and selected ENA read runs to a Galaxy history for analysis with your workflow.",
  workflowName: "Send Data to a Galaxy History",
};
