import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { ConfiguredValue } from "./types";

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
  const { geneModelUrl, readRuns, referenceAssembly } = configuredInput;

  // If workflow is not available yet, return undefined
  if (!workflow?.parameters) return undefined;

  // Check which parameters are required by the workflow
  const requiresReference = workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL
  );
  const requiresGTF = workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL
  );
  const requiresFASTQ = workflow.parameters.some(
    (param) =>
      param.variable === WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED ||
      param.variable === WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE
  );

  // Only check for required values
  if (requiresReference && !referenceAssembly) return;
  if (requiresGTF && !geneModelUrl) return;
  if (requiresFASTQ && !readRuns) return;

  return {
    geneModelUrl,
    readRuns,
    referenceAssembly,
  };
}
