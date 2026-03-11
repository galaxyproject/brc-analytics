import {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  ORGANISM_PLOIDY,
  WORKFLOW_PLOIDY,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";

// Type constraint: both BRC and GA2 assemblies have these fields
type AssemblyForCompatibility = {
  accession: string;
  lineageTaxonomyIds: string[];
  ploidy: ORGANISM_PLOIDY[];
};

/**
 * NOTE: The compatibility functions below are intentionally duplicated from:
 * - app/apis/catalog/brc-analytics-catalog/common/utils.ts (workflowPloidyMatchesOrganismPloidy)
 * - app/components/Entity/components/AnalysisMethodsCatalog/utils.ts (workflowIsCompatibleWithAssembly)
 *
 * They cannot be imported directly because this build script uses generics to work with both
 * BRC and GA2 assembly types, while the app functions have concrete type signatures.
 * If you modify the compatibility logic, update BOTH locations to keep them in sync.
 * Consider creating a shared utility module to avoid duplication.
 */

// Helper function to check ploidy compatibility
function workflowPloidyMatchesOrganismPloidy(
  workflowPloidy: WORKFLOW_PLOIDY,
  organismPloidy: ORGANISM_PLOIDY
): boolean {
  switch (workflowPloidy) {
    case WORKFLOW_PLOIDY.ANY:
      return true;
    case WORKFLOW_PLOIDY.DIPLOID:
      return organismPloidy === ORGANISM_PLOIDY.DIPLOID;
    case WORKFLOW_PLOIDY.HAPLOID:
      return organismPloidy === ORGANISM_PLOIDY.HAPLOID;
    case WORKFLOW_PLOIDY.POLYPLOID:
      return organismPloidy === ORGANISM_PLOIDY.POLYPLOID;
    default:
      return false;
  }
}

// Helper function to check workflow-assembly compatibility
function workflowIsCompatibleWithAssembly<T extends AssemblyForCompatibility>(
  workflow: { ploidy: WORKFLOW_PLOIDY; taxonomyId: string | null },
  assembly: T
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

// Generic workflow-assembly mapping builder - works for both BRC and GA2
export function buildWorkflowAssemblyMappings<
  T extends AssemblyForCompatibility,
>(
  workflowCategories: WorkflowCategory[],
  assemblies: T[]
): WorkflowAssemblyMapping[] {
  const mappings: WorkflowAssemblyMapping[] = [];

  // Flatten workflows from all categories and deduplicate by trsId
  // (workflows can appear in multiple categories)
  const workflowsByTrsId = new Map(
    workflowCategories
      .flatMap((cat) => cat.workflows)
      .map((workflow) => [workflow.trsId, workflow])
  );

  for (const workflow of workflowsByTrsId.values()) {
    const compatibleAssemblyCount = assemblies.filter((assembly) =>
      workflowIsCompatibleWithAssembly(workflow, assembly)
    ).length;

    mappings.push({
      compatibleAssemblyCount,
      workflowTrsId: workflow.trsId,
    });
  }

  return mappings;
}

// Generic QC report generator - site name is parameterized
export function generateWorkflowMappingsQC(
  mappings: WorkflowAssemblyMapping[],
  workflowCategories: WorkflowCategory[],
  siteName: string
): string {
  const workflows = workflowCategories.flatMap((cat) => cat.workflows);

  // Create a lookup map for quick access
  const mappingsByTrsId = new Map(
    mappings.map((m) => [m.workflowTrsId, m.compatibleAssemblyCount])
  );

  const workflowsWithNoAssemblies = workflows.filter(
    (wf) => (mappingsByTrsId.get(wf.trsId) ?? 0) === 0
  );

  const lines: string[] = [
    `# Workflow-Assembly Mappings QC Report (${siteName})`,
    "",
    "## Workflows with no compatible assemblies",
    "",
  ];

  if (workflowsWithNoAssemblies.length === 0) {
    lines.push("None", "");
  } else {
    for (const wf of workflowsWithNoAssemblies) {
      const reason = wf.taxonomyId
        ? `taxonomy_id: ${wf.taxonomyId}`
        : `ploidy: ${wf.ploidy}`;
      lines.push(`- ${wf.workflowName} (${wf.trsId}) — ${reason}`);
    }
    lines.push("");
  }

  lines.push(
    "## Workflow-Assembly Coverage Summary",
    "",
    "| Workflow | Compatible Assemblies |",
    "|----------|----------------------|"
  );

  for (const wf of workflows) {
    const count = mappingsByTrsId.get(wf.trsId) ?? 0;
    lines.push(`| ${wf.workflowName} | ${count} |`);
  }

  lines.push("", "## Summary Statistics", "");
  lines.push(`- Total active workflows: ${workflows.length}`);
  lines.push(
    `- Workflows with ≥1 compatible assembly: ${workflows.length - workflowsWithNoAssemblies.length}`
  );
  lines.push(
    `- Workflows with 0 compatible assemblies: ${workflowsWithNoAssemblies.length}`
  );
  lines.push("");

  return lines.join("\n");
}
