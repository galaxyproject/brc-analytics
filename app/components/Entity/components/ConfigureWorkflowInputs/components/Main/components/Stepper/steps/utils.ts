import { Workflow } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { StepConfig } from "../components/Step/types";
import { STEP } from "./constants";
import {
  SINGLE_END_STEP,
  PAIRED_END_STEP,
} from "../components/Step/SequencingStep/step";

/**
 * Augment the configured steps with two additional sequencing steps "READ_RUNS_PAIRED" and "READ_RUNS_SINGLE"
 * if "READ_RUNS_ANY" is configured.
 * Allows the user to configure both single and paired end reads in the same step and render those values
 * in the summary.
 * @param configuredSteps - The configured steps.
 * @returns The augmented steps.
 */
export function augmentConfiguredSteps(
  configuredSteps: StepConfig[]
): StepConfig[] {
  if (configuredSteps.some((step) => step.key === "readRunsAny")) {
    return [...configuredSteps, PAIRED_END_STEP, SINGLE_END_STEP];
  }
  return configuredSteps;
}

/**
 * Builds the steps for the stepper based on the workflow and workflow parameters.
 * @param workflow - Workflow.
 * @returns Steps.
 */
export function buildSteps(workflow: Workflow): StepConfig[] {
  // Return steps for custom workflow
  if (workflow.trsId === "custom-workflow") {
    return [STEP.ASSEMBLY_ID, STEP.GENE_MODEL_URL, STEP.READ_RUN_ANY].filter(
      isStepConfigured
    );
  }

  // Get workflow variables from the workflow.
  const variables = workflow.parameters
    .map((param) => param.variable)
    .filter((param) => !!param);

  // Return the steps, ordered by workflow variable.
  return (
    [
      WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID,
      WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL,
      WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
      WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
    ]
      .filter(
        (variable) =>
          // For now, ASSEMBLY_ID is always required.
          variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID ||
          // Only include variables that the workflow has.
          variables.includes(variable)
      )
      .map((variable) => STEP[variable])
      // Only include variables that a step is configured for.
      .filter(isStepConfigured)
  );
}

/**
 * Checks if a step is configured.
 * @param step - Step.
 * @returns True if the step is configured, false otherwise.
 */
function isStepConfigured(step: StepConfig | null): step is StepConfig {
  return step !== null;
}
