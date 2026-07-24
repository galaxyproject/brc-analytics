import { StepConfig } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

/**
 * Step keys that correspond to a Sequencing step. Includes both the
 * array-based step types (readRunsPaired/Single/Any) and the file-based
 * scalar step types (readRunSingleFile/PairedFile, introduced by #1314).
 */
export const SEQUENCING_STEP_KEYS = new Set<StepConfig["key"]>([
  "readRunsPaired",
  "readRunsSingle",
  "readRunsAny",
  "readRunSingleFile",
  "readRunPairedFile",
]);
