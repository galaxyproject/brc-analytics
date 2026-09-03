import type {
  AssemblyContract,
  OrganismContract,
} from "@repo/shared/apis/types";
import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "@repo/shared/apis/workflow";
import { TAXON_ANY } from "@repo/shared/viewModelBuilders/constants";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import type { WorkflowGates } from "@repo/shared/workflow/featureFlags";
import { LMLS_WORKFLOWS } from "@repo/shared/workflow/lmls";
import { workflowMeetsAssemblyMinimum } from "@repo/shared/workflow/utils";
import type { WorkflowAssembly, WorkflowEntity } from "./types";

/**
 * Finds the first assembly matching the given taxonomy ID from a pre-built index.
 * @param assemblyByTaxonomyId - Map of lineage taxonomy IDs to assemblies.
 * @param taxonomyId - Workflow taxonomy ID.
 * @returns Assembly matching the taxonomy ID, or undefined.
 */
function findAssemblyByTaxonomyId(
  assemblyByTaxonomyId: Map<string, AssemblyContract>,
  taxonomyId: string | null
): AssemblyContract | undefined {
  if (!taxonomyId) return undefined;
  return assemblyByTaxonomyId.get(taxonomyId);
}

/**
 * Returns the common names of the assembly, or ["Any"] if the assembly is undefined.
 * `commonNames` is only present on some assemblies; those without it return ["Any"].
 * Returns ["None"] when the assembly exists but has no common names.
 * Each name becomes its own filter facet bucket.
 * @param assembly - Assembly.
 * @returns The list of common names, ["None"], or ["Any"].
 */
function getCommonNames(assembly: AssemblyContract | undefined): string[] {
  // A missing commonNames field reads as ["Any"]; a present-but-empty
  // commonNames reads as ["None"].
  if (!assembly || assembly.commonNames === undefined) return [TAXON_ANY];
  return assembly.commonNames.length ? assembly.commonNames : ["None"];
}

/**
 * Returns the taxonomic level realm of the assembly, or "Any" if the assembly is undefined.
 * `taxonomicLevelRealm` is only present on some assemblies; those without it return "Any".
 * @param assembly - Assembly.
 * @returns The taxonomic level realm, or "Any".
 */
function getTaxonomicLevelRealm(
  assembly: AssemblyContract | undefined
): string {
  return assembly?.taxonomicLevelRealm ?? TAXON_ANY;
}

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Filters out workflows that have no compatible assemblies for the current site.
 * Differential Expression Analysis is always included as an interim measure.
 * Sequence Analysis workflows (Logan Search and Lexicmap) are appended rather
 * than sourced from the catalog, and gate through the same rules as the rest.
 * Each workflow includes the properties of the workflow itself along with the name of its category and the compatible assembly (if any).
 * @param workflowCategories - An array of workflow categories, each containing an array of workflows.
 * @param mappings - Workflow-assembly mappings for the current site.
 * @param organisms - Organisms.
 * @param workflowGates - Feature-flag gating rules bound to the user's flag state.
 * @returns An array of workflows, where each workflow is a combination of a workflow and its category name.
 */
export function getWorkflows(
  workflowCategories: WorkflowCategory[],
  mappings: WorkflowAssemblyMapping[],
  organisms: OrganismContract[],
  workflowGates: WorkflowGates
): WorkflowEntity[] {
  const workflows: WorkflowEntity[] = [];

  const assemblyByTaxonomyId = indexAssemblyByTaxonomyId(organisms);

  // Create a lookup map from TRS ID to compatible assembly count.
  const compatibleCountByTrsId = new Map(
    mappings.map((m) => [m.workflowTrsId, m.compatibleAssemblyCount])
  );

  for (const category of workflowGates.filterCategories(workflowCategories)) {
    if (!category.workflows) continue;
    for (const workflow of category.workflows) {
      // Skip workflows whose minimum assembly requirement cannot be met.
      const count = compatibleCountByTrsId.get(workflow.trsId) ?? 0;
      if (!workflowMeetsAssemblyMinimum(workflow.assemblyCountMin, count)) {
        continue;
      }

      workflows.push({
        ...workflow,
        assembly: mapAssembly(
          findAssemblyByTaxonomyId(assemblyByTaxonomyId, workflow.taxonomyId)
        ),
        category: category.name,
        scope: String(workflow.scope),
        taxonomyId: workflow.taxonomyId ?? TAXON_ANY,
      } as WorkflowEntity);
    }
  }

  // Add Differential Expression Analysis workflow (interim measure).
  workflows.push({
    ...DIFFERENTIAL_EXPRESSION_ANALYSIS,
    assembly: mapAssembly(undefined),
    category: "Transcriptomics",
    scope: String(DIFFERENTIAL_EXPRESSION_ANALYSIS.scope),
    taxonomyId: TAXON_ANY,
  } as WorkflowEntity);

  // Sequence Analysis workflows aren't in the catalog, so they're appended
  // here — through the same gate as every catalog workflow above.
  for (const workflow of LMLS_WORKFLOWS) {
    if (!workflowGates.isWorkflowAllowed(workflow)) continue;
    workflows.push({
      ...workflow,
      assembly: mapAssembly(undefined),
      category: "Sequence Analysis",
      scope: String(workflow.scope),
      taxonomyId: TAXON_ANY,
    } as WorkflowEntity);
  }

  return workflows;
}

/**
 * Indexes assemblies by their lineage taxonomy IDs for O(1) lookups.
 * Each lineage taxonomy ID maps to the first assembly that contains it.
 * @param organisms - Organisms.
 * @returns Map of lineage taxonomy ID to assembly.
 */
function indexAssemblyByTaxonomyId(
  organisms: OrganismContract[]
): Map<string, AssemblyContract> {
  const assemblyByTaxonomyId = new Map<string, AssemblyContract>();
  for (const organism of organisms) {
    for (const genome of (organism.genomes || []) as AssemblyContract[]) {
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
 * Includes all taxonomy fields plus site-specific fields (commonNames, taxonomicLevelRealm)
 * which are present at runtime for all sites but only typed on site-specific WorkflowEntity extensions.
 * If the assembly is undefined, returns default values for the properties.
 * @param assembly - The assembly to map.
 * @returns Assembly object for the WorkflowEntity.
 */
function mapAssembly(assembly: AssemblyContract | undefined): WorkflowAssembly {
  return {
    commonNames: getCommonNames(assembly),
    taxonomicLevelClass: assembly?.taxonomicLevelClass ?? TAXON_ANY,
    taxonomicLevelDomain: assembly?.taxonomicLevelDomain ?? TAXON_ANY,
    taxonomicLevelFamily: assembly?.taxonomicLevelFamily ?? TAXON_ANY,
    taxonomicLevelGenus: assembly?.taxonomicLevelGenus ?? TAXON_ANY,
    taxonomicLevelKingdom: assembly?.taxonomicLevelKingdom ?? TAXON_ANY,
    taxonomicLevelOrder: assembly?.taxonomicLevelOrder ?? TAXON_ANY,
    taxonomicLevelPhylum: assembly?.taxonomicLevelPhylum ?? TAXON_ANY,
    taxonomicLevelRealm: getTaxonomicLevelRealm(assembly),
    taxonomicLevelSpecies: assembly?.taxonomicLevelSpecies ?? TAXON_ANY,
  };
}
