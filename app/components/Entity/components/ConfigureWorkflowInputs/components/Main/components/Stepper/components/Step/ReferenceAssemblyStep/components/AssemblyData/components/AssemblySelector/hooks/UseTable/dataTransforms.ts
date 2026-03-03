import { Workflow } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { WORKFLOW_PLOIDY } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { Assembly as BaseAssembly } from "../../../../../../../../../../../../../../../../../views/WorkflowInputsView/types";
import { Assembly } from "./types";

/**
 * Builds validation object for an assembly based on workflow ploidy requirements.
 * @param assembly - The assembly to validate.
 * @param workflow - The workflow containing ploidy requirements.
 * @returns Validation object indicating if the assembly is valid and any error message.
 */
function buildValidation(
  assembly: BaseAssembly,
  workflow: Workflow
): Assembly["validation"] {
  const { ploidy } = workflow;

  // Ploidy is "ANY", so all assemblies are valid.
  if (ploidy === WORKFLOW_PLOIDY.ANY) return { isValid: true };

  // Ploidy must be in the set of assembly ploidy values to be valid.
  const setPloidy = new Set<string>(assembly.ploidy);
  if (setPloidy.has(ploidy)) return { isValid: true };

  // Ploidy requirements not met.
  return {
    error: "Ploidy requirements not met",
    isValid: false,
  };
}

/**
 * Maps assemblies to assemblies with validation.
 * @param assemblies - Assemblies.
 * @param workflow - Workflow.
 * @returns Assemblies with validation.
 */
export function mapAssembly(
  assemblies: BaseAssembly[],
  workflow: Workflow
): Assembly[] {
  return (
    assemblies?.map((assembly) => ({
      ...assembly,
      validation: buildValidation(assembly, workflow),
    })) || []
  );
}
