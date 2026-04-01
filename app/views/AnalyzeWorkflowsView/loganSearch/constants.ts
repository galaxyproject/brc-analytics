import { Workflow } from "../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

export const LOGAN_SEARCH: Workflow = {
  iwcId: "",
  parameters: [],
  ploidy: WORKFLOW_PLOIDY.ANY,
  scope: WORKFLOW_SCOPE.SEQUENCE,
  taxonomyId: null,
  trsId: "logan-search",
  workflowDescription:
    "Fast sequence search using Logan/kmindex against SRA with automatic download. Provides strict matches for quick identification of sequences in SRA databases.",
  workflowId: "5c11d1ff71bb1ec6",
  workflowName: "Logan Search / kmindex",
};
