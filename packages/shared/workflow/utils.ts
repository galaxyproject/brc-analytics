import {
  ORGANISM_PLOIDY,
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
} from "@repo/shared/apis/schema-types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { type ParsedUrlQuery } from "querystring";

/**
 * Determines whether any of the given workflow categories lists the workflow.
 * Matches on the raw TRS ID, as the catalog records it.
 * @param workflowCategories - Workflow categories.
 * @param workflow - Workflow.
 * @returns True when a category lists the workflow.
 */
export function categoriesIncludeWorkflow(
  workflowCategories: WorkflowCategory[],
  workflow: Workflow
): boolean {
  return workflowCategories.some(({ workflows }) =>
    workflows.some(({ trsId }) => trsId === workflow.trsId)
  );
}

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
 * Resolves the selected workflow TRS ID from a router query, treating an empty
 * value as absent.
 * @param query - Router query.
 * @returns TRS ID, or undefined when absent or empty.
 */
export function getTrsId(query: ParsedUrlQuery): string | undefined {
  return typeof query.trsId === "string" && query.trsId
    ? query.trsId
    : undefined;
}

/**
 * Indexes workflows by the id they are looked up under: their URL-formatted
 * TRS id, for catalog and extra workflows alike, so a workflow page's URL
 * finds either. A workflow listed more than once under the same TRS id (the
 * catalog lists a workflow under each category it belongs to) is indexed once,
 * as its last listing, so an extra workflow overrides a catalog one.
 * @param workflowCategories - Catalog workflow categories.
 * @param extraWorkflows - Additional workflows outside the catalog.
 * @returns Map of id to workflow.
 * @throws If two workflows with different TRS ids format to the same id, since
 * the URL could then resolve to either.
 */
export function indexWorkflowsById<T extends Pick<Workflow, "trsId">>(
  workflowCategories: readonly { workflows: readonly T[] }[],
  extraWorkflows: readonly T[] = []
): Map<string, T> {
  const workflowById = new Map<string, T>();
  for (const workflow of [
    ...workflowCategories.flatMap(({ workflows }) => workflows),
    ...extraWorkflows,
  ]) {
    const id = formatTrsId(workflow.trsId);
    const indexed = workflowById.get(id);
    if (indexed && indexed.trsId !== workflow.trsId)
      throw new Error(
        `Workflows "${indexed.trsId}" and "${workflow.trsId}" share the URL id "${id}"`
      );
    workflowById.set(id, workflow);
  }
  return workflowById;
}

/**
 * Determines whether a workflow's minimum assembly requirement can be met
 * given the number of compatible assemblies available.
 * Used by both the QC report and the UI workflow-list filter as the
 * single source of truth for this rule.
 * @param assemblyCountMin - Minimum assemblies required (0 = none required).
 * @param compatibleAssemblyCount - Number of compatible assemblies available.
 * @returns True if the requirement is met (user can run the workflow).
 */
export function workflowMeetsAssemblyMinimum(
  assemblyCountMin: number,
  compatibleAssemblyCount: number
): boolean {
  return assemblyCountMin === 0 || compatibleAssemblyCount >= assemblyCountMin;
}

/**
 * Get whether a given workflow ploidy is compatible with a given organism ploidy.
 * @param workflowPloidy - Workflow ploidy.
 * @param organismPloidy - Organism ploidy.
 * @returns boolean indicating whether the given ploidy values are compatible.
 */
export function workflowPloidyMatchesOrganismPloidy(
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

/**
 * Determines whether a workflow's maximum assembly limit has been reached by
 * the given number of selected assemblies.
 * @param assemblyCountMax - Maximum assemblies allowed (null = no limit).
 * @param selectedAssemblyCount - Number of assemblies selected.
 * @returns True if no further assembly can be selected.
 */
export function workflowReachesAssemblyMaximum(
  assemblyCountMax: number | null,
  selectedAssemblyCount: number
): boolean {
  return assemblyCountMax !== null && selectedAssemblyCount >= assemblyCountMax;
}

/**
 * Checks if a workflow requires the ASSEMBLY_ID parameter.
 * Workflows with ASSEMBLY_ID depend on Galaxy having pre-built indexes (dbkey) for the assembly.
 * @param workflow - The workflow to check.
 * @returns True if the workflow has a parameter with ASSEMBLY_ID variable, false otherwise.
 */
export function workflowRequiresAssemblyId(workflow: Workflow): boolean {
  return workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID
  );
}

/**
 * Checks if a workflow requires the FASTA_COLLECTION parameter.
 * @param workflow - The workflow to check.
 * @returns True if the workflow has a parameter with FASTA_COLLECTION variable, false otherwise.
 */
export function workflowRequiresFastaCollection(workflow: Workflow): boolean {
  return workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.FASTA_COLLECTION
  );
}
