import {
  ORGANISM_PLOIDY,
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
} from "@repo/shared/apis/schema-types";
import type { Workflow } from "@repo/shared/apis/workflow";
import { type ParsedUrlQuery } from "querystring";

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
