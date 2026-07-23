import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { ConfiguredInput } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { Workflow } from "@repo/shared/apis/workflow";
import type { WorkflowRunCreateRequest } from "@repo/shared/services/api-client/types";
import {
  ConfiguredValue,
  isAssemblyConfiguredValue,
  isSequenceConfiguredValue,
} from "./types";

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
    readRunPairedFile: null,
    readRunSingleFile: null,
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
  const {
    geneModelUrl,
    readRunPairedFile,
    readRunSingleFile,
    readRunsPaired,
    readRunsSingle,
    referenceAssembly,
  } = configuredInput;

  // If workflow is not available yet, return undefined
  if (!workflow?.parameters) return;
  // ASSEMBLY-scope workflows always require referenceAssembly
  if (!referenceAssembly) return;

  // Check which parameters are required by the workflow
  const requiredParams = getRequiredParameterTypes(workflow);

  // For geneModelUrl, treat empty string as valid (user skipped or will upload manually)
  if (requiredParams.GENE_MODEL_URL && geneModelUrl === null) return;
  if (requiredParams.SANGER_READ_RUN_SINGLE && !readRunsSingle) return;
  if (requiredParams.SANGER_READ_RUN_PAIRED && !readRunsPaired) return;
  if (
    requiredParams.SANGER_READ_RUN_SINGLE_FILE &&
    readRunSingleFile === undefined
  )
    return;
  if (
    (requiredParams.SANGER_READ_RUN_FORWARD_FILE ||
      requiredParams.SANGER_READ_RUN_REVERSE_FILE) &&
    readRunPairedFile === undefined
  )
    return;

  return {
    _scope: "ASSEMBLY",
    designFormula: null,
    geneModelUrl: geneModelUrl ?? null,
    primaryContrasts: null,
    readRunPairedFile: readRunPairedFile ?? null,
    readRunSingleFile: readRunSingleFile ?? null,
    readRunsPaired: readRunsPaired ?? null,
    readRunsSingle: readRunsSingle ?? null,
    referenceAssembly,
    sampleSheet: null,
    sampleSheetClassification: null,
    strandedness: undefined,
    tracks: configuredInput.tracks ?? null,
  };
}

/**
 * Validates and returns configured values for ORGANISM scope workflows.
 * @param configuredInput - Configured input.
 * @param workflow - Workflow to check required parameters.
 * @returns Configured values for ORGANISM workflow or undefined if invalid.
 */
function getOrganismScopeConfiguredValues(
  configuredInput: ConfiguredInput,
  workflow: Workflow
): ConfiguredValue | undefined {
  const {
    readRunPairedFile,
    readRunSingleFile,
    readRunsPaired,
    readRunsSingle,
  } = configuredInput;

  if (!workflow?.parameters) return;

  const requiredParams = getRequiredParameterTypes(workflow);

  if (requiredParams.SANGER_READ_RUN_SINGLE && !readRunsSingle) return;
  if (requiredParams.SANGER_READ_RUN_PAIRED && !readRunsPaired) return;
  if (
    requiredParams.SANGER_READ_RUN_SINGLE_FILE &&
    readRunSingleFile === undefined
  )
    return;
  if (
    (requiredParams.SANGER_READ_RUN_FORWARD_FILE ||
      requiredParams.SANGER_READ_RUN_REVERSE_FILE) &&
    readRunPairedFile === undefined
  )
    return;

  return {
    _scope: "ORGANISM",
    fastaCollection: null,
    readRunPairedFile: readRunPairedFile ?? null,
    readRunSingleFile: readRunSingleFile ?? null,
    readRunsPaired: readRunsPaired ?? null,
    readRunsSingle: readRunsSingle ?? null,
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
    readRunPairedFile: null,
    readRunSingleFile: null,
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
      return getOrganismScopeConfiguredValues(configuredInput, workflow);
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

interface BuildWorkflowRunPayloadParams {
  assistantSessionId: string | null;
  configuredInput: ConfiguredInput;
  configuredValue: ConfiguredValue;
  handoffUrl: string;
  workflow: Workflow;
}

export function buildWorkflowRunPayload({
  assistantSessionId,
  configuredInput,
  configuredValue,
  handoffUrl,
  workflow,
}: BuildWorkflowRunPayloadParams): WorkflowRunCreateRequest {
  let galaxyInstanceUrl: string | null = null;

  try {
    galaxyInstanceUrl = new URL(handoffUrl).origin;
  } catch {
    galaxyInstanceUrl = null;
  }

  // Assembly-scope and sequence-scope variants carry distinct fields; narrow
  // before reading so the tracking payload tolerates any scope.
  const isAssembly = isAssemblyConfiguredValue(configuredValue);
  const isSequence = isSequenceConfiguredValue(configuredValue);

  return {
    assembly_accession: isAssembly ? configuredValue.referenceAssembly : null,
    assistant_session_id: assistantSessionId,
    galaxy_instance_url: galaxyInstanceUrl,
    handoff_url: handoffUrl,
    launch_source: assistantSessionId ? "assistant" : "site",
    parameters: {
      design_formula: isAssembly
        ? (configuredValue.designFormula ?? null)
        : null,
      gene_model_url: isAssembly
        ? (configuredValue.geneModelUrl ?? null)
        : null,
      number_of_hits: isSequence
        ? (configuredValue.numberOfHits ?? null)
        : null,
      primary_contrasts: isAssembly
        ? (configuredValue.primaryContrasts ?? null)
        : null,
      read_runs_paired:
        configuredValue.readRunsPaired?.map(
          ({ runAccession }) => runAccession
        ) ?? [],
      read_runs_single:
        configuredValue.readRunsSingle?.map(
          ({ runAccession }) => runAccession
        ) ?? [],
      sample_sheet_classification: isAssembly
        ? (configuredValue.sampleSheetClassification ?? null)
        : null,
      sample_sheet_rows: isAssembly
        ? (configuredValue.sampleSheet?.length ?? 0)
        : 0,
      sequence_file_name: configuredInput.sequenceFileName ?? null,
      sequence_length: isSequence
        ? (configuredValue.sequence?.length ?? null)
        : null,
      strandedness: isAssembly ? (configuredValue.strandedness ?? null) : null,
      tracks:
        configuredValue.tracks?.map((track) => ({
          group_id: track.groupId,
          name: track.shortLabel ?? track.longLabel ?? track.bigDataUrl,
          url: track.bigDataUrl,
        })) ?? [],
    },
    workflow_id: workflow.workflowId ?? null,
    workflow_trs_id: workflow.trsId,
  };
}
