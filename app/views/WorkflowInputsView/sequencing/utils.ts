import { StepConfig } from "../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SEQUENCING_STEP_KEYS } from "./constants";

/**
 * Find the key of the sequencing step in a configured-step list, or
 * undefined if the workflow has none.
 * @param configuredSteps - Workflow's configured steps.
 * @returns Sequencing step key, or undefined.
 */
export function findSequencingStepKey(
  configuredSteps: StepConfig[]
): StepConfig["key"] | undefined {
  return configuredSteps.find((s) => SEQUENCING_STEP_KEYS.has(s.key))?.key;
}
