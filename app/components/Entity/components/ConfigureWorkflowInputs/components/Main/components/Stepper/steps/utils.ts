import { Workflow } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { StepConfig } from "../components/Step/types";
import { STEP } from "./constants";
import { CUSTOM_WORKFLOW } from "../../../../../../../../../components/Entity/components/AnalysisMethod/components/CustomWorkflow/constants";
import { ConfiguredInput } from "../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../../../AnalysisMethod/components/DifferentialExpressionAnalysis/constants";

/**
 * Augment the configured steps with two additional sequencing steps "READ_RUNS_PAIRED" and "READ_RUNS_SINGLE".
 * Allows the user to configure both single and paired end reads and render those values in the summary.
 * @param configuredSteps - Configured steps.
 * @param configuredInput - Configured input.
 * @param sequencingSteps - Sequencing steps.
 * @returns Augmented steps.
 */
export function augmentConfiguredSteps(
  configuredSteps: StepConfig[],
  configuredInput: ConfiguredInput,
  sequencingSteps: Record<string, StepConfig>
): StepConfig[] {
  const steps = [...configuredSteps];
  const stepKeys: Set<string> = new Set(configuredSteps.map((s) => s.key));
  for (const [key, step] of Object.entries(sequencingSteps)) {
    if (stepKeys.has(key)) continue;
    if (configuredInput[key as keyof ConfiguredInput]) {
      steps.push(step);
    }
  }
  return steps;
}

/**
 * Builds the steps for the stepper based on the workflow and workflow parameters.
 * @param workflow - Workflow.
 * @returns Steps.
 */
export function buildSteps(workflow: Workflow): StepConfig[] {
  // Return steps for custom workflow
  if (workflow.trsId === CUSTOM_WORKFLOW.trsId) {
    return [STEP.ASSEMBLY_ID, STEP.RELATED_TRACKS, STEP.READ_RUN_ANY].filter(
      isStepConfigured
    );
  }

  // Return steps for differential expression analysis
  if (workflow.trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId) {
    return [
      STEP.ASSEMBLY_ID,
      STEP.GENE_MODEL_URL,
      STEP.SAMPLE_SHEET,
      STEP.SAMPLE_SHEET_CLASSIFICATION,
      STEP.DESEQ2_FORMULA,
      STEP.PRIMARY_CONTRASTS,
    ].filter(isStepConfigured);
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
