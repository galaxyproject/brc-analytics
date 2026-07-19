import { WORKFLOW_PARAMETER_VARIABLE } from "@/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { SEQUENCING_DATA_FILE_TYPE } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/types";

// Maps each sequencing step key to the workflow parameter variable it configures.
// readRunPairedFile maps to SANGER_READ_RUN_FORWARD_FILE because the paired-file
// step represents both forward and reverse reads as a single selection.
export const WORKFLOW_PARAMETER_BY_STEP_KEY: Record<
  SEQUENCING_DATA_FILE_TYPE,
  WORKFLOW_PARAMETER_VARIABLE
> = {
  readRunPairedFile: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_FORWARD_FILE,
  readRunSingleFile: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE_FILE,
  readRunsPaired: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
  readRunsSingle: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
};
