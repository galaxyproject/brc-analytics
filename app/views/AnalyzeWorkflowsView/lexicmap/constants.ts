import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@brc-analytics/core/apis/schema-types";
import type { Workflow } from "@brc-analytics/core/apis/workflow";

export const LEXICMAP: Workflow = {
  assemblyCountMax: 0,
  assemblyCountMin: 0,
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
