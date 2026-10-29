import type { Workflow } from "@repo/shared/apis/workflow";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { getRequiredAssemblyCount } from "@repo/shared/workflow/utils";

/**
 * Formats a number of assemblies, e.g. "1 assembly" or "3 assemblies".
 * @param count - Number of assemblies.
 * @returns The formatted count.
 */
export function formatAssemblyCount(count: number): string {
  return `${count} ${count === 1 ? "assembly" : "assemblies"}`;
}

/**
 * Returns the number of configured assemblies, as the step's value.
 * @param configuredInput - Configured workflow inputs.
 * @param configuredInput.fastaCollection - Configured assembly accessions.
 * @returns The formatted count, or undefined when no assembly is configured.
 */
export function getFastaCollectionLabel({
  fastaCollection,
}: ConfiguredInput): string | undefined {
  if (!fastaCollection?.length) return;
  return formatAssemblyCount(fastaCollection.length);
}

/**
 * Determines whether a number of assemblies is enough to run the workflow.
 * @param assemblyCount - Number of assemblies.
 * @param workflow - Workflow being configured.
 * @returns True when the workflow can run with that many assemblies.
 */
export function hasEnoughAssemblies(
  assemblyCount: number,
  workflow: Workflow
): boolean {
  return assemblyCount >= getRequiredAssemblyCount(workflow);
}

/**
 * Determines whether enough assemblies are configured to continue.
 * @param configuredInput - Configured workflow inputs.
 * @param configuredInput.fastaCollection - Configured assembly accessions.
 * @param workflow - Workflow being configured.
 * @returns True when the configured assemblies are enough to run the workflow.
 */
export function isFastaCollectionConfigured(
  { fastaCollection }: ConfiguredInput,
  workflow: Workflow
): boolean {
  return hasEnoughAssemblies(fastaCollection?.length ?? 0, workflow);
}
