import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { SEQUENCING_DATA_TYPE } from "../../../../types";

export const WORKFLOW_PARAMETER_BY_STEP_KEY: Record<
  SEQUENCING_DATA_TYPE.READ_RUNS_PAIRED | SEQUENCING_DATA_TYPE.READ_RUNS_SINGLE,
  WORKFLOW_PARAMETER_VARIABLE
> = {
  readRunsPaired: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
  readRunsSingle: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
};
