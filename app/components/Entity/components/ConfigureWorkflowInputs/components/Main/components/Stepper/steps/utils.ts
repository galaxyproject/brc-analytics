import { Workflow } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_SCOPE,
} from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { CUSTOM_WORKFLOW } from "../../../../../../../../../views/AnalyzeWorkflowsView/custom/constants";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../../../../../../views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { ConfiguredInput } from "../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { StepConfig } from "../components/Step/types";
import { STEP } from "./constants";

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
 * Scope-aware: Different workflow scopes determine the first step:
 * - ASSEMBLY (default): First step is assembly selection (ASSEMBLY_ID)
 * - ORGANISM: First step would be organism selection/confirmation (not yet implemented)
 * - SEQUENCE: First step would be sequence FASTA upload (not yet implemented)
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
      STEP.STRANDEDNESS,
      STEP.SAMPLE_SHEET_CLASSIFICATION,
      STEP.DESEQ2_FORMULA,
      STEP.PRIMARY_CONTRASTS,
    ].filter(isStepConfigured);
  }

  // Get workflow variables from the workflow.
  const variables = workflow.parameters
    .map((param) => param.variable)
    .filter((param) => !!param);

  // Scope-aware step building:
  const workflowScope = workflow.scope;

  // Handle different workflow scopes
  switch (workflowScope) {
    case WORKFLOW_SCOPE.ASSEMBLY:
      // ASSEMBLY scope: Include assembly selection as first step
      return [
        WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID,
        WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL,
        WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE,
        WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
      ]
        .filter(
          (variable) =>
            // ASSEMBLY_ID is always included for ASSEMBLY scope
            variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID ||
            // Include other variables that the workflow has
            variables.includes(variable)
        )
        .map((variable) => STEP[variable])
        .filter(isStepConfigured);

    case WORKFLOW_SCOPE.ORGANISM:
      // Implement organism selection/confirmation step
      console.warn(
        `ORGANISM scope workflows not yet implemented for workflow: ${workflow.workflowName}`
      );
      return [];

    case WORKFLOW_SCOPE.SEQUENCE:
      return [STEP.SEQUENCE].filter(isStepConfigured);

    default:
      console.error(`Unknown workflow scope: ${workflowScope}`);
      return [];
  }
}

/**
 * Checks if a step is configured.
 * @param step - Step.
 * @returns True if the step is configured, false otherwise.
 */
function isStepConfigured(step: StepConfig | null): step is StepConfig {
  return step !== null;
}
