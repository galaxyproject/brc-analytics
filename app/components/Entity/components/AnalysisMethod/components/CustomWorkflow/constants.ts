import {
  WORKFLOW_PLOIDY,
  WORKFLOW_PARAMETER_VARIABLE,
} from "../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";

export const CUSTOM_WORKFLOW: Workflow = {
  iwcId: "",
  parameters: [
    {
      key: "Paired collection of sequencing data",
      variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
    },
    {
      key: "Reference annotation",
      variable: WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL,
    },
  ],
  ploidy: WORKFLOW_PLOIDY.ANY,
  taxonomyId: null,
  trsId: "custom-workflow",
  workflowDescription:
    "Analyze selected data in the context of this assembly in your own Galaxy workflow.",
  workflowName: "Custom / No Workflow",
};
