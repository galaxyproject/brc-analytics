import { Workflow } from "../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

export const LEXICMAP: Workflow = {
  iwcId: "",
  parameters: [],
  ploidy: WORKFLOW_PLOIDY.ANY,
  scope: WORKFLOW_SCOPE.SEQUENCE,
  taxonomyId: null,
  trsId: "lexicmap",
  workflowDescription:
    "Sequence alignment search using LexicMap against SRA with automatic download. Builds alignments for more flexible matching, returns BLAST-like results.",
  workflowId: "2ec2cdefc28b2418",
  workflowName: "LexicMap",
};
