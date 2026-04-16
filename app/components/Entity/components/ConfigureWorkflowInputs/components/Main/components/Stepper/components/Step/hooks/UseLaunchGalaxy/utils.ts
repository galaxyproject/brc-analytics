import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../../../../../../../../../views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { ConfiguredValue } from "./types";

export function getRequiredParameterTypes(
  workflow: Workflow
): Record<WORKFLOW_PARAMETER_VARIABLE, boolean> {
  const result: Record<WORKFLOW_PARAMETER_VARIABLE, boolean> =
    Object.fromEntries(
      Object.values(WORKFLOW_PARAMETER_VARIABLE).map((variable) => [
        variable,
        workflow.parameters.some((param) => param.variable === variable),
      ])
    ) as Record<WORKFLOW_PARAMETER_VARIABLE, boolean>;

  return result;
}

/**
 * Validates and returns configured values for DE workflow.
 * @param configuredInput - Configured input.
 * @returns Configured values for DE workflow or undefined if invalid.
 */
function getDEConfiguredValues(
  configuredInput: ConfiguredInput
): ConfiguredValue | undefined {
  const {
    designFormula,
    geneModelUrl,
    primaryContrasts,
    referenceAssembly,
    sampleSheet,
    sampleSheetClassification,
    strandedness,
  } = configuredInput;

  // Validate required fields for DE workflow
  if (
    !referenceAssembly ||
    !geneModelUrl ||
    !sampleSheet?.length ||
    !sampleSheetClassification ||
    !designFormula
  ) {
    return;
  }

  return {
    _scope: "ASSEMBLY",
    designFormula,
    geneModelUrl,
    primaryContrasts: primaryContrasts ?? null,
    readRunsPaired: null,
    readRunsSingle: null,
    referenceAssembly,
    sampleSheet,
    sampleSheetClassification,
    strandedness,
    tracks: null,
  };
}

/**
 * Validates and returns configured values for standard workflows.
 * @param configuredInput - Configured input.
 * @param workflow - Workflow to check required parameters.
 * @returns Configured values for ASSEMBLY workflow or undefined if invalid.
 */
function getAssemblyScopeConfiguredValues(
  configuredInput: ConfiguredInput,
  workflow: Workflow
): ConfiguredValue | undefined {
  const { geneModelUrl, readRunsPaired, readRunsSingle, referenceAssembly } =
    configuredInput;

  // If workflow is not available yet, return undefined
  if (!workflow?.parameters) return;
  // Check which parameters are required by the workflow
  const requiredParams = getRequiredParameterTypes(workflow);

  // Only check for required values
  if (requiredParams.ASSEMBLY_FASTA_URL && !referenceAssembly) return;
  // For geneModelUrl, treat empty string as valid (user skipped or will upload manually)
  if (requiredParams.GENE_MODEL_URL && geneModelUrl === null) return;
  if (requiredParams.SANGER_READ_RUN_SINGLE && !readRunsSingle) return;
  if (requiredParams.SANGER_READ_RUN_PAIRED && !readRunsPaired) return;

  return {
    _scope: "ASSEMBLY",
    designFormula: null,
    geneModelUrl: geneModelUrl ?? null,
    primaryContrasts: null,
    readRunsPaired: readRunsPaired ?? null,
    readRunsSingle: readRunsSingle ?? null,
    referenceAssembly: referenceAssembly!,
    sampleSheet: null,
    sampleSheetClassification: null,
    strandedness: undefined,
    tracks: configuredInput.tracks ?? null,
  };
}

/**
 * Returns default configured values for ORGANISM scope workflows.
 * ORGANISM scope workflows may have collection_spec and variables but don't require assembly-specific inputs.
 * For Phase 1, return default/empty values to allow launching directly in Galaxy.
 * The collection_spec will be automatically passed by the Galaxy API.
 * Phase 2 will add stepper UI to populate these values from user input.
 * @returns Configured values for ORGANISM workflow.
 * (Phase 2): Add validation for required parameters (e.g., check if fastaCollection or
 * other organism-specific inputs are required by the workflow and return undefined if missing).
 */
function getOrganismScopeConfiguredValues(): ConfiguredValue {
  return {
    _scope: "ORGANISM",
    fastaCollection: null,
    readRunsPaired: null,
    readRunsSingle: null,
    tracks: null,
  };
}

/**
 * Validates and returns configured values for SEQUENCE scope workflows.
 * SEQUENCE scope workflows (like LMLS) require sequence FASTA and numberOfHits from user input.
 * @param configuredInput - Configured input.
 * @returns Configured values for SEQUENCE workflow or undefined if invalid.
 */
function getSequenceScopeConfiguredValues(
  configuredInput: ConfiguredInput
): ConfiguredValue | undefined {
  const { numberOfHits, sequence } = configuredInput;

  // Validate required fields for SEQUENCE workflows
  if (!sequence || numberOfHits === undefined) {
    return;
  }

  return {
    _scope: "SEQUENCE",
    numberOfHits,
    readRunsPaired: null,
    readRunsSingle: null,
    sequence,
    tracks: null,
  };
}

/**
 * Returns the configured values from the configured input.
 * @param configuredInput - Configured input.
 * @param workflow - Workflow to check required parameters.
 * @returns Configured values.
 */
export function getConfiguredValues(
  configuredInput: ConfiguredInput,
  workflow: Workflow
): ConfiguredValue | undefined {
  // Handle Differential Expression Analysis workflow separately (special case - not in IWC yet)
  if (workflow.trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId) {
    return getDEConfiguredValues(configuredInput);
  }

  // For all other workflows, use scope-based logic
  switch (workflow.scope) {
    case "ASSEMBLY":
      return getAssemblyScopeConfiguredValues(configuredInput, workflow);
    case "ORGANISM":
      return getOrganismScopeConfiguredValues();
    case "SEQUENCE":
      return getSequenceScopeConfiguredValues(configuredInput);
  }
}

/**
 * Launches the Galaxy workflow.
 * Creates a hidden anchor element and clicks it to launch the workflow.
 * @param url - Galaxy URL.
 */
export function launchGalaxy(url: string): void {
  const el = document.createElement("a");
  el.href = url;
  el.rel = REL_ATTRIBUTE.NO_OPENER_NO_REFERRER;
  el.target = ANCHOR_TARGET.BLANK;
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}
