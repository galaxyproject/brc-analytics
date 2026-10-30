import type { Workflow } from "@repo/shared/apis/workflow";
import { formatAssemblyCount } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/utils";

/**
 * Renders the prompt stating how many assemblies the workflow takes.
 * @param workflow - Workflow being configured.
 * @returns The prompt.
 */
export function renderAssemblyRequirement(workflow: Workflow): string {
  const { assemblyCountMax, assemblyCountMin: min } = workflow;
  if (assemblyCountMax === null)
    return `Browse to find and select at least ${formatAssemblyCount(min)}`;
  if (assemblyCountMax <= min)
    return `Browse to find and select ${formatAssemblyCount(min)}`;
  return `Browse to find and select ${min} to ${assemblyCountMax} assemblies`;
}
