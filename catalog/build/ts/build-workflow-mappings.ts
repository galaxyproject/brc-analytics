import {
  Workflow,
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

// Port from app/apis/catalog/brc-analytics-catalog/common/utils.ts:42-56
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
  }
}

// Port from app/components/Entity/components/AnalysisMethodsCatalog/utils.ts:88-101
// Generic version that works with both BRC and GA2 assemblies
function workflowIsCompatibleWithAssembly<T extends AssemblyForCompatibility>(
  workflow: Workflow,
  assembly: T
): boolean {
  // Check taxonomy compatibility
  if (
    workflow.taxonomyId !== null &&
    !assembly.lineageTaxonomyIds.includes(workflow.taxonomyId)
  ) {
    return false;
  }
  // Check ploidy compatibility
  return assembly.ploidy.some((assemblyPloidy) =>
    workflowPloidyMatchesOrganismPloidy(workflow.ploidy, assemblyPloidy)
  );
}

// Generic mapping builder - works for both BRC and GA2
export function buildWorkflowAssemblyMappings<
  T extends AssemblyForCompatibility,
>(
  workflowCategories: WorkflowCategory[],
  assemblies: T[]
): WorkflowAssemblyMapping[] {
  const mappings: WorkflowAssemblyMapping[] = [];

  // Flatten workflows from all categories
  const workflows = workflowCategories.flatMap((cat) => cat.workflows);

  for (const workflow of workflows) {
    const compatibleAssemblyAccessions = assemblies
      .filter((assembly) => workflowIsCompatibleWithAssembly(workflow, assembly))
      .map((assembly) => assembly.accession);

    mappings.push({
      compatibleAssemblyAccessions,
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
    mappings.map((m) => [m.workflowTrsId, m.compatibleAssemblyAccessions])
  );
  
  const workflowsWithNoAssemblies = workflows.filter(
    (wf) => (mappingsByTrsId.get(wf.trsId)?.length ?? 0) === 0
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
    const count = mappingsByTrsId.get(wf.trsId)?.length ?? 0;
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
