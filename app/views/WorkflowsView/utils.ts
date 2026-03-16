import type { WorkflowEntity } from "../../../site-config/brc-analytics/local/index/workflow/types";
import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { Assembly } from "../WorkflowInputsView/types";
import { Organism } from "./types";

/**
 * Returns the common name of the assembly, or "Unspecified" if the assembly is undefined.
 * `commonName` is only present on BRC assemblies; GA2 assemblies will return "Unspecified".
 * Returns "null" as a string when the assembly exists but commonName is null.
 * @param assembly - Assembly.
 * @returns The common name, "null", or "Unspecified".
 */
function getCommonName(assembly: Assembly | undefined): string {
  if (hasCommonName(assembly)) {
    return assembly.commonName ?? "null";
  }

  return "Unspecified";
}

/**
 * Returns the taxonomic level realm of the assembly, or "Unspecified" if the assembly is undefined.
 * `taxonomicLevelRealm` is only present on BRC assemblies; GA2 assemblies will return "Unspecified".
 * @param assembly - Assembly.
 * @returns The taxonomic level realm, or "Unspecified".
 */
function getTaxonomicLevelRealm(assembly: Assembly | undefined): string {
  if (assembly && "taxonomicLevelRealm" in assembly)
    return assembly.taxonomicLevelRealm;

  return "Unspecified";
}

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Filters out workflows that have no compatible assemblies for the current site.
 * Each workflow includes the properties of the workflow itself along with the name of its category and the compatible assembly (if any).
 * @param workflowCategories - An array of workflow categories, each containing an array of workflows.
 * @param mappings - Workflow-assembly mappings for the current site.
 * @param organisms - Organisms.
 * @returns An array of workflows, where each workflow is a combination of a workflow and its category name.
 */
export function getWorkflows(
  workflowCategories: WorkflowCategory[],
  mappings: WorkflowAssemblyMapping[],
  organisms: Organism[]
): WorkflowEntity[] {
  const workflows: WorkflowEntity[] = [];

  // Flatten organism genomes for easy lookup of assemblies with matching lineage taxonomy IDs.
  const assemblies = organisms.flatMap((o) => (o.genomes || []) as Assembly[]);

  // Create a lookup map for workflows with compatible assemblies
  const workflowsWithAssemblies = new Set(
    mappings
      .filter((m) => m.compatibleAssemblyCount > 0)
      .map((m) => m.workflowTrsId)
  );

  for (const category of workflowCategories) {
    if (!category.workflows) continue;
    for (const workflow of category.workflows) {
      // Skip workflows with no compatible assemblies
      if (!workflowsWithAssemblies.has(workflow.trsId)) {
        continue;
      }

      workflows.push({
        ...workflow,
        assembly: mapAssembly(findAssembly(assemblies, workflow.taxonomyId)),
        category: category.name,
        taxonomyId: workflow.taxonomyId ?? "Unspecified",
      });
    }
  }

  return workflows;
}

/**
 * Finds the first assembly in the list that is compatible with the given workflow taxonomy ID i.e. the assembly's lineage includes the workflow taxonomy ID.
 * If no compatible assembly is found, returns undefined.
 * If the workflow taxonomy ID is null, returns undefined.
 * @param assemblies - Assemblies.
 * @param taxonomyId - Workflow taxonomy ID.
 * @returns Assembly compatible with the workflow taxonomy ID, or undefined if no compatible assembly is found or if the taxonomy ID is null.
 */
function findAssembly(
  assemblies: Assembly[],
  taxonomyId: string | null
): Assembly | undefined {
  if (!taxonomyId) return undefined;

  return assemblies.find((assembly) =>
    assembly.lineageTaxonomyIds.includes(taxonomyId)
  );
}

/**
 * Type guard to check if an assembly has a commonName property.
 * @param assembly - The assembly to check.
 * @returns True if the assembly has a commonName property; false otherwise.
 */
function hasCommonName(
  assembly: Assembly | undefined
): assembly is Assembly & { commonName: string | null } {
  return assembly !== undefined && "commonName" in assembly;
}

/**
 * Maps an Assembly to the assembly property of a WorkflowEntity.
 * If the assembly is undefined, returns default values for the properties.
 * @param assembly - The assembly to map.
 * @returns Assembly object for the WorkflowEntity.
 */
function mapAssembly(
  assembly: Assembly | undefined
): WorkflowEntity["assembly"] {
  return {
    commonName: getCommonName(assembly),
    taxonomicLevelClass: assembly?.taxonomicLevelClass ?? "Unspecified",
    taxonomicLevelDomain: assembly?.taxonomicLevelDomain ?? "Unspecified",
    taxonomicLevelFamily: assembly?.taxonomicLevelFamily ?? "Unspecified",
    taxonomicLevelGenus: assembly?.taxonomicLevelGenus ?? "Unspecified",
    taxonomicLevelKingdom: assembly?.taxonomicLevelKingdom ?? "Unspecified",
    taxonomicLevelOrder: assembly?.taxonomicLevelOrder ?? "Unspecified",
    taxonomicLevelPhylum: assembly?.taxonomicLevelPhylum ?? "Unspecified",
    taxonomicLevelRealm: getTaxonomicLevelRealm(assembly),
    taxonomicLevelSpecies: assembly?.taxonomicLevelSpecies ?? "Unspecified",
  };
}
