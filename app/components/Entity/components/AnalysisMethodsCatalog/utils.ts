import { workflowPloidyMatchesOrganismPloidy } from "../../../../apis/catalog/brc-analytics-catalog/common/utils";
import {
  BRCDataCatalogGenome,
  Workflow,
} from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../apis/catalog/ga2/entities";

/**
 * Formats a trsId for use in URLs by removing the hash character if it begins with one
 * and replacing any special characters with hyphens.
 * @param trsId - The trsId to format.
 * @returns The formatted trsId.
 */
export function formatTrsId(trsId: string): string {
  return trsId.replace(/^#/, "").replace(/[^a-zA-Z0-9]/g, "-");
}

/**
 * Determines if a workflow is compatible with a given assembly.
 * @param workflow - The workflow to check compatibility for.
 * @param assembly - The assembly to check compatibility against.
 * @returns True if the workflow is compatible with the assembly, false otherwise.
 */
export function workflowIsCompatibleWithAssembly(
  workflow: Workflow,
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity
): boolean {
  if (
    workflow.taxonomyId !== null &&
    !assembly.lineageTaxonomyIds.includes(workflow.taxonomyId)
  ) {
    return false;
  }
  return assembly.ploidy.some((assemblyPloidy) =>
    workflowPloidyMatchesOrganismPloidy(workflow.ploidy, assemblyPloidy)
  );
}
