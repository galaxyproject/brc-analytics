import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { Assembly } from "../WorkflowInputsView/types";
import type { WorkflowAssembly, WorkflowEntity } from "./types";
import { Organism } from "./types";

/**
 * Finds the first assembly matching the given taxonomy ID from a pre-built index.
 * @param assemblyByTaxonomyId - Map of lineage taxonomy IDs to assemblies.
 * @param taxonomyId - Workflow taxonomy ID.
 * @returns Assembly matching the taxonomy ID, or undefined.
 */
function findAssemblyByTaxonomyId(
  assemblyByTaxonomyId: Map<string, Assembly>,
  taxonomyId: string | null
): Assembly | undefined {
  if (!taxonomyId) return undefined;
  return assemblyByTaxonomyId.get(taxonomyId);
}

/**
 * Returns the common name of the assembly, or "Any" if the assembly is undefined.
 * `commonName` is only present on BRC assemblies; GA2 assemblies will return "Any".
 * Returns "null" as a string when the assembly exists but commonName is null.
 * @param assembly - Assembly.
 * @returns The common name, "null", or "Any".
 */
function getCommonName(assembly: Assembly | undefined): string {
  if (hasCommonName(assembly)) {
    return assembly.commonName ?? "null";
  }

  return "Any";
}

/**
 * Returns the taxonomic level realm of the assembly, or "Any" if the assembly is undefined.
 * `taxonomicLevelRealm` is only present on BRC assemblies; GA2 assemblies will return "Any".
 * @param assembly - Assembly.
 * @returns The taxonomic level realm, or "Any".
 */
function getTaxonomicLevelRealm(assembly: Assembly | undefined): string {
  if (assembly && "taxonomicLevelRealm" in assembly)
    return assembly.taxonomicLevelRealm;

  return "Any";
}

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Filters out workflows that have no compatible assemblies for the current site.
 * Differential Expression Analysis is always included as an interim measure.
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

  const assemblyByTaxonomyId = indexAssemblyByTaxonomyId(organisms);

  // Create a lookup set for workflows with compatible assemblies.
  const workflowsWithAssemblies = new Set(
    mappings
      .filter((m) => m.compatibleAssemblyCount > 0)
      .map((m) => m.workflowTrsId)
  );

  for (const category of workflowCategories) {
    if (!category.workflows) continue;
    for (const workflow of category.workflows) {
      // Skip workflows with no compatible assemblies.
      if (!workflowsWithAssemblies.has(workflow.trsId)) {
        continue;
      }

      workflows.push({
        ...workflow,
        assembly: mapAssembly(
          findAssemblyByTaxonomyId(assemblyByTaxonomyId, workflow.taxonomyId)
        ),
        category: category.name,
        taxonomyId: workflow.taxonomyId ?? "Any",
      });
    }
  }

  // Add Differential Expression Analysis workflow (interim measure).
  workflows.push({
    ...DIFFERENTIAL_EXPRESSION_ANALYSIS,
    assembly: mapAssembly(undefined),
    category: "Transcriptomics",
    taxonomyId: "Any",
  });

  return workflows;
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
 * Indexes assemblies by their lineage taxonomy IDs for O(1) lookups.
 * Each lineage taxonomy ID maps to the first assembly that contains it.
 * @param organisms - Organisms.
 * @returns Map of lineage taxonomy ID to assembly.
 */
function indexAssemblyByTaxonomyId(
  organisms: Organism[]
): Map<string, Assembly> {
  const assemblyByTaxonomyId = new Map<string, Assembly>();
  for (const organism of organisms) {
    for (const genome of (organism.genomes || []) as Assembly[]) {
      for (const taxId of genome.lineageTaxonomyIds) {
        if (!assemblyByTaxonomyId.has(taxId)) {
          assemblyByTaxonomyId.set(taxId, genome);
        }
      }
    }
  }
  return assemblyByTaxonomyId;
}

/**
 * Maps an Assembly to the workflow assembly fields.
 * Includes all taxonomy fields plus site-specific fields (commonName, taxonomicLevelRealm)
 * which are present at runtime for all sites but only typed on site-specific WorkflowEntity extensions.
 * If the assembly is undefined, returns default values for the properties.
 * @param assembly - The assembly to map.
 * @returns Assembly object for the WorkflowEntity.
 */
function mapAssembly(assembly: Assembly | undefined): WorkflowAssembly {
  return {
    commonName: getCommonName(assembly),
    taxonomicLevelClass: assembly?.taxonomicLevelClass ?? "Any",
    taxonomicLevelDomain: assembly?.taxonomicLevelDomain ?? "Any",
    taxonomicLevelFamily: assembly?.taxonomicLevelFamily ?? "Any",
    taxonomicLevelGenus: assembly?.taxonomicLevelGenus ?? "Any",
    taxonomicLevelKingdom: assembly?.taxonomicLevelKingdom ?? "Any",
    taxonomicLevelOrder: assembly?.taxonomicLevelOrder ?? "Any",
    taxonomicLevelPhylum: assembly?.taxonomicLevelPhylum ?? "Any",
    taxonomicLevelRealm: getTaxonomicLevelRealm(assembly),
    taxonomicLevelSpecies: assembly?.taxonomicLevelSpecies ?? "Any",
  };
}
