import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { ConfiguredValue } from "./types";

/**
 * Returns the configured values from the configured input.
 * @param configuredInput - Configured input.
 * @returns Configured values.
 */
export function getConfiguredValues(
  configuredInput: ConfiguredInput
): ConfiguredValue | undefined {
  const { geneModelUrl, readRuns, referenceAssembly } = configuredInput;
  if (!geneModelUrl || !readRuns || !referenceAssembly) return;
  return {
    geneModelUrl,
    readRuns,
    referenceAssembly,
  };
}
