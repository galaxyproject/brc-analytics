import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Workflow } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { ConfiguredValue } from "./types";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";

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
 * Returns the configured values from the configured input.
 * @param configuredInput - Configured input.
 * @param workflow - Workflow to check required parameters.
 * @returns Configured values.
 */
export function getConfiguredValues(
  configuredInput: ConfiguredInput,
  workflow: Workflow
): ConfiguredValue | undefined {
  const { geneModelUrl, readRunsPaired, readRunsSingle, referenceAssembly } =
    configuredInput;

  // If workflow is not available yet, return undefined
  if (!workflow?.parameters) return undefined;
  // Check which parameters are required by the workflow
  const requiredParams = getRequiredParameterTypes(workflow);

  // Only check for required values
  if (requiredParams.ASSEMBLY_FASTA_URL && !referenceAssembly) return;
  // For geneModelUrl, treat empty string as valid (user skipped or will upload manually)
  if (requiredParams.GENE_MODEL_URL && geneModelUrl === null) return;
  if (requiredParams.SANGER_READ_RUN_SINGLE && !readRunsSingle) return;
  if (requiredParams.SANGER_READ_RUN_PAIRED && !readRunsPaired) return;

  return {
    geneModelUrl: geneModelUrl ?? null,
    readRunsPaired: readRunsPaired ?? null,
    readRunsSingle: readRunsSingle ?? null,
    // referenceAssembly is currently always set, but there are workflows that don't require referenceAssembly.
    // xref https://github.com/galaxyproject/brc-analytics/issues/652
    referenceAssembly: referenceAssembly!,
  };
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
