import {
  WorkflowAssemblyMapping,
  WorkflowCategory,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import {
  ORGANISM_PLOIDY,
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
} from "../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";
import { workflowMeetsAssemblyMinimum } from "../../../app/apis/catalog/brc-analytics-catalog/common/workflowAssembly";

// Type constraint: both BRC and GA2 assemblies have these fields
type AssemblyForCompatibility = {
  accession: string;
  galaxyDatacacheUrl: string | null;
  lineageTaxonomyIds: string[];
  ploidy: ORGANISM_PLOIDY[];
};

/**
 * NOTE: This workflow/assembly compatibility rule (taxonomy lineage + ploidy +
 * assembly-id requirement) is duplicated in four places that drift out of sync:
 * - this file (build time)
 * - app/views/AnalyzeWorkflowsView/components/Main/utils.ts (frontend runtime;
 *   shares only workflowPloidyMatchesOrganismPloidy from common/utils.ts)
 * - backend/api/app/services/catalog_data.py (MCP server)
 * - backend/api/app/services/tools/catalog_data.py (assistant agent)
 *
 * The TS copies can't import each other today only because this build script is
 * generic over BRC/GA2 assembly types while the app function has a concrete
 * signature -- a single generic in common/ would fix that. #1319 was caused by
 * this drift. If you change the rule, update all four. Consolidating to a single
 * source of truth is tracked in #1327.
 */

// Helper function to check if workflow requires ASSEMBLY_ID parameter
function workflowRequiresAssemblyId(workflow: {
  parameters: Array<{ variable?: string }>;
}): boolean {
  return workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID
  );
}

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
  }
}

// Helper function to check workflow-assembly compatibility
function workflowIsCompatibleWithAssembly<T extends AssemblyForCompatibility>(
  workflow: {
    parameters: Array<{ variable?: string }>;
    ploidy: WORKFLOW_PLOIDY;
    taxonomyId: string | null;
  },
  assembly: T
): boolean {
  if (
    workflow.taxonomyId !== null &&
    !assembly.lineageTaxonomyIds.includes(workflow.taxonomyId)
  ) {
    return false;
  }
  if (
    !assembly.ploidy.some((assemblyPloidy) =>
      workflowPloidyMatchesOrganismPloidy(workflow.ploidy, assemblyPloidy)
    )
  ) {
    return false;
  }
  // Filter out workflows requiring ASSEMBLY_ID when assembly lacks Galaxy datacache URL.
  // ASSEMBLY_ID workflows need pre-built indexes (Bowtie2, BWA, etc.) accessible via datacache.
  if (workflowRequiresAssemblyId(workflow) && !assembly.galaxyDatacacheUrl) {
    return false;
  }
  return true;
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

export type AssemblyForTaxonomyCheck = {
  lineageTaxonomyIds: string[];
  ncbiTaxonomyId: string;
  speciesTaxonomyId: string;
};

// Generic QC report generator - site name is parameterized
export function generateWorkflowMappingsQC(
  mappings: WorkflowAssemblyMapping[],
  workflowCategories: WorkflowCategory[],
  siteName: string,
  assemblies?: AssemblyForTaxonomyCheck[]
): string {
  const workflows = workflowCategories.flatMap((cat) => cat.workflows);

  // Create a lookup map for quick access
  const mappingsByTrsId = new Map(
    mappings.map((m) => [m.workflowTrsId, m.compatibleAssemblyCount])
  );

  const workflowsWithUnmetMinimum = workflows.filter(
    (wf) =>
      !workflowMeetsAssemblyMinimum(
        wf.assemblyCountMin,
        mappingsByTrsId.get(wf.trsId) ?? 0
      )
  );

  const lines: string[] = [
    `# Workflow-Assembly Mappings QC Report (${siteName})`,
    "",
    "## Workflows that cannot meet their minimum assembly requirement",
    "",
  ];

  if (workflowsWithUnmetMinimum.length === 0) {
    lines.push("None", "");
  } else {
    for (const wf of workflowsWithUnmetMinimum) {
      const count = mappingsByTrsId.get(wf.trsId) ?? 0;
      const reason = wf.taxonomyId
        ? `taxonomy_id: ${wf.taxonomyId}`
        : `ploidy: ${wf.ploidy}`;
      lines.push(
        `- ${wf.workflowName} (${wf.trsId}) — needs >= ${wf.assemblyCountMin}, ${count} compatible (${reason})`
      );
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
    `- Workflows that meet their minimum assembly requirement: ${workflows.length - workflowsWithUnmetMinimum.length}`
  );
  lines.push(
    `- Workflows that cannot meet minimum assembly requirement: ${workflowsWithUnmetMinimum.length}`
  );
  lines.push("");

  lines.push(
    "## Workflow taxonomy ID issues (not in catalog or below species rank)",
    ""
  );
  lines.push(...formatTaxonomyIssuesLines(workflows, assemblies));

  return lines.join("\n");
}

function formatTaxonomyIssuesLines(
  workflows: {
    taxonomyId: string | null;
    trsId: string;
    workflowName: string;
  }[],
  assemblies: AssemblyForTaxonomyCheck[] | undefined
): string[] {
  if (assemblies === undefined) return ["N/A", ""];
  const issues = checkWorkflowTaxonomyIds(workflows, assemblies);
  if (issues.length === 0) return ["None", ""];
  return [
    ...issues.map(
      ({ reason, trsId, workflowName }) =>
        `- ${workflowName} (${trsId}): ${reason}`
    ),
    "",
  ];
}

/**
 * Check workflow taxonomy IDs against assembly lineage data.
 * Flags taxonomy IDs that are not in any assembly's lineage (not in catalog),
 * or that only appear as sub-species assembly IDs (below species rank).
 * A taxonomy ID is considered at species rank or above if it equals the
 * speciesTaxonomyId of at least one assembly, or if it appears in assembly
 * lineages but is not the direct ncbiTaxonomyId of any sub-species assembly.
 * @param workflows - Workflows to check, each with a nullable taxonomyId.
 * @param assemblies - Assembly data providing lineage and species taxonomy IDs.
 * @returns List of issues, each with a reason, trsId, and workflowName.
 */
function checkWorkflowTaxonomyIds(
  workflows: {
    taxonomyId: string | null;
    trsId: string;
    workflowName: string;
  }[],
  assemblies: AssemblyForTaxonomyCheck[]
): { reason: string; trsId: string; workflowName: string }[] {
  const allLineageIds = new Set(
    assemblies.flatMap((a) => a.lineageTaxonomyIds)
  );
  const speciesIds = new Set(assemblies.map((a) => a.speciesTaxonomyId));
  // ncbiTaxonomyIds that are below species rank (assembly is a strain/serotype/etc.)
  const subSpeciesNcbiIds = new Set(
    assemblies
      .filter((a) => a.ncbiTaxonomyId !== a.speciesTaxonomyId)
      .map((a) => a.ncbiTaxonomyId)
  );

  // Deduplicate workflows by trsId before checking
  const seenTrsIds = new Set<string>();
  const issues: { reason: string; trsId: string; workflowName: string }[] = [];

  for (const wf of workflows) {
    if (wf.taxonomyId === null || seenTrsIds.has(wf.trsId)) continue;
    seenTrsIds.add(wf.trsId);

    if (!allLineageIds.has(wf.taxonomyId)) {
      issues.push({
        reason: "taxonomy ID not found in any assembly's lineage",
        trsId: wf.trsId,
        workflowName: wf.workflowName,
      });
    } else if (
      !speciesIds.has(wf.taxonomyId) &&
      subSpeciesNcbiIds.has(wf.taxonomyId)
    ) {
      issues.push({
        reason: "taxonomy ID appears to be below species rank",
        trsId: wf.trsId,
        workflowName: wf.workflowName,
      });
    }
  }

  return issues;
}
