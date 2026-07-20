import { workflowMeetsAssemblyMinimum } from "@/apis/catalog/brc-analytics-catalog/common/workflowAssembly";
import type { AssemblyContract } from "@brc-analytics/core/apis/types";
import type {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "@brc-analytics/core/apis/workflow";
import { WorkflowCategoryId } from "../../../catalog/schema/generated/schema";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { LEXICMAP } from "../AnalyzeWorkflowsView/lexicmap/constants";
import { LOGAN_SEARCH } from "../AnalyzeWorkflowsView/loganSearch/constants";
import type { Assembly } from "../WorkflowInputsView/types";
import type { Organism, WorkflowAssembly, WorkflowEntity } from "./types";

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
function getCommonName(assembly: AssemblyContract | undefined): string {
  // A missing commonName field (GA2 assemblies) reads as "Any"; a present-but-
  // null commonName (BRC) reads as the string "null".
  if (!assembly || assembly.commonName === undefined) return "Any";
  return assembly.commonName ?? "null";
}

/**
 * Returns the taxonomic level realm of the assembly, or "Any" if the assembly is undefined.
 * `taxonomicLevelRealm` is only present on BRC assemblies; GA2 assemblies will return "Any".
 * @param assembly - Assembly.
 * @returns The taxonomic level realm, or "Any".
 */
function getTaxonomicLevelRealm(
  assembly: AssemblyContract | undefined
): string {
  return assembly?.taxonomicLevelRealm ?? "Any";
}

/**
 * Checks if a workflow should be included based on feature flags.
 * @param workflow - Workflow to check.
 * @param workflow.trsId - TRS ID of the workflow.
 * @param isHyphyEnabled - Whether the 'hyphy' feature flag is enabled.
 * @returns True if the workflow should be included, false otherwise.
 */
function shouldIncludeWorkflow(
  workflow: { trsId: string },
  isHyphyEnabled: boolean
): boolean {
  const isHyphyWorkflow =
    workflow.trsId ===
    "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/v0.1";

  return !isHyphyWorkflow || isHyphyEnabled;
}

/**
 * Utility function to transform workflow categories into a flat list of workflows.
 * Filters out workflows that have no compatible assemblies for the current site.
 * Differential Expression Analysis is always included as an interim measure.
 * LMLS workflows (Logan Search and Lexicmap) are included when the 'lmls' feature flag is enabled.
 * Hyphy workflow is conditionally included based on the 'hyphy' feature flag.
 * Assembly workflows are conditionally included based on the 'assembly-workflows' feature flag.
 * Each workflow includes the properties of the workflow itself along with the name of its category and the compatible assembly (if any).
 * @param workflowCategories - An array of workflow categories, each containing an array of workflows.
 * @param mappings - Workflow-assembly mappings for the current site.
 * @param organisms - Organisms.
 * @param isAssemblyWorkflowsEnabled - Whether the 'assembly-workflows' feature flag is enabled.
 * @param isLmlsEnabled - Whether the 'lmls' feature flag is enabled.
 * @param isHyphyEnabled - Whether the 'hyphy' feature flag is enabled.
 * @returns An array of workflows, where each workflow is a combination of a workflow and its category name.
 */
export function getWorkflows(
  workflowCategories: WorkflowCategory[],
  mappings: WorkflowAssemblyMapping[],
  organisms: Organism[],
  isAssemblyWorkflowsEnabled = false,
  isLmlsEnabled = false,
  isHyphyEnabled = false
): WorkflowEntity[] {
  const workflows: WorkflowEntity[] = [];

  const assemblyByTaxonomyId = indexAssemblyByTaxonomyId(organisms);

  // Create a lookup map from TRS ID to compatible assembly count.
  const compatibleCountByTrsId = new Map(
    mappings.map((m) => [m.workflowTrsId, m.compatibleAssemblyCount])
  );

  for (const category of workflowCategories) {
    if (!category.workflows) continue;
    if (
      category.category === WorkflowCategoryId.ASSEMBLY &&
      !isAssemblyWorkflowsEnabled
    )
      continue;
    for (const workflow of category.workflows) {
      // Skip workflows based on feature flags.
      if (!shouldIncludeWorkflow(workflow, isHyphyEnabled)) {
        continue;
      }

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
        taxonomyId: workflow.taxonomyId ?? "Any",
      } as WorkflowEntity);
    }
  }

  // Add Differential Expression Analysis workflow (interim measure).
  workflows.push({
    ...DIFFERENTIAL_EXPRESSION_ANALYSIS,
    assembly: mapAssembly(undefined),
    category: "Transcriptomics",
    scope: String(DIFFERENTIAL_EXPRESSION_ANALYSIS.scope),
    taxonomyId: "Any",
  } as WorkflowEntity);

  // Add LMLS workflows if feature flag is enabled.
  if (isLmlsEnabled) {
    workflows.push({
      ...LOGAN_SEARCH,
      assembly: mapAssembly(undefined),
      category: "Sequence Analysis",
      scope: String(LOGAN_SEARCH.scope),
      taxonomyId: "Any",
    } as WorkflowEntity);

    workflows.push({
      ...LEXICMAP,
      assembly: mapAssembly(undefined),
      category: "Sequence Analysis",
      scope: String(LEXICMAP.scope),
      taxonomyId: "Any",
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
