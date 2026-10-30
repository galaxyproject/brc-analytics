import type { Workflow } from "@repo/shared/apis/workflow";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";

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
  return assemblyCount >= workflow.assemblyCountMin;
}

/**
 * Determines whether the configured assemblies can run the workflow: at least
 * the required number, and no more than the workflow's maximum.
 * @param configuredInput - Configured workflow inputs.
 * @param configuredInput.fastaCollection - Configured assembly accessions.
 * @param workflow - Workflow being configured.
 * @returns True when the configured assemblies can run the workflow.
 */
export function isFastaCollectionConfigured(
  { fastaCollection }: ConfiguredInput,
  workflow: Workflow
): boolean {
  const count = fastaCollection?.length ?? 0;
  if (!hasEnoughAssemblies(count, workflow)) return false;
  return (
    workflow.assemblyCountMax === null || count <= workflow.assemblyCountMax
  );
}
