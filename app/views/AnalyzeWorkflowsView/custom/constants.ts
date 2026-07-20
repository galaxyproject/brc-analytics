import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@brc-analytics/core/apis/schema-types";
import type { Workflow } from "@brc-analytics/core/apis/workflow";

export const CUSTOM_WORKFLOW: Workflow = {
  assemblyCountMax: 1,
  assemblyCountMin: 1,
  iwcId: "",
  parameters: [
    {
      key: "Reference annotation",
      variable: WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL,
    },
  ],
  ploidy: WORKFLOW_PLOIDY.ANY,
  scope: WORKFLOW_SCOPE.ASSEMBLY,
  taxonomyId: null,
  trsId: "custom-workflow",
  workflowDescription:
    "Send this assembly, related UCSC Browser tracks, and selected ENA read runs to a Galaxy history for analysis with your workflow.",
  workflowName: "Send Data to a Galaxy History",
};
