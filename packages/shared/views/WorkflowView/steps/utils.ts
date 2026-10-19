import type { Workflow } from "@repo/shared/apis/workflow";
import { STEP as ORGANISM_STEP } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/OrganismStep/step";
import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SEQUENCING_STEPS } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { hasCladeOrganisms } from "@repo/shared/workflow/cladeOrganisms";

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

/**
 * Determines whether the configured steps include a read-run (sequencing) step.
 * @param configuredSteps - Configured steps.
 * @returns True when any step is a sequencing step.
 */
function hasSequencingStep(configuredSteps: StepConfig[]): boolean {
  return configuredSteps.some((step) => step.key in SEQUENCING_STEPS);
}

/**
 * Inserts the Organism step ahead of the other steps when an organism-scoped
 * workflow's taxonomyId is a clade above species, so the user picks the
 * species that scopes the read-run step. The step is only inserted when the
 * workflow has a read-run step to scope and the clade has at least one catalog
 * organism to pick; otherwise the steps are returned unchanged.
 * @param configuredSteps - Configured steps.
 * @param workflow - Workflow being configured.
 * @returns The configured steps, with the Organism step first when applicable.
 */
export function insertOrganismStep(
  configuredSteps: StepConfig[],
  workflow: Workflow
): StepConfig[] {
  if (!hasSequencingStep(configuredSteps)) return configuredSteps;
  if (!hasCladeOrganisms(workflow)) return configuredSteps;
  return [ORGANISM_STEP, ...configuredSteps];
}
