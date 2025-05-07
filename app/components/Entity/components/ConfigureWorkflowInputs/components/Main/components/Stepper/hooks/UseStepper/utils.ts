import { StepConfig } from "../../components/Step/types";

/**
 * Returns the index of the first step that is not disabled.
 * @param steps - Array of steps.
 * @returns Index of the first step that is not disabled.
 */
export function getInitialActiveStep(steps: StepConfig[]): number {
  return steps.findIndex((step) => !step.disabled);
}

/**
 * Returns the index of the next step that is not disabled.
 * @param steps - Array of steps.
 * @param currentStep - Current step index.
 * @returns Index of the next step that is not disabled.
 */
export function getNextActiveStep(
  steps: StepConfig[],
  currentStep: number
): number {
  // Start searching from the next step
  for (let i = currentStep + 1; i < steps.length; i++) {
    if (!steps[i].disabled) {
      return i;
    }
  }
  return steps.length;
}
