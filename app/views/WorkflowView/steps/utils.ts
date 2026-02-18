import { StepConfig } from "../../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";

/**
 * Enables the Reference Assembly step in the step configuration.
 * @param configuredSteps - Configured steps to update.
 * @returns A new array of step configurations with the Reference Assembly step enabled.
 */
export function enableReferenceAssemblyStep(
  configuredSteps: StepConfig[]
): StepConfig[] {
  return configuredSteps.map((step) => {
    if (step.key === "referenceAssembly") {
      return { ...step, disabled: false };
    }
    return step;
  });
}
