import { ANALYSIS_METHOD } from "./entities";

export const WORKFLOW_IDS_BY_ANALYSIS_METHOD: Partial<
  Record<ANALYSIS_METHOD, string>
> = {
  [ANALYSIS_METHOD.REGULATION]:
    "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/chipseq-pe/main/versions/v0.12",
};
