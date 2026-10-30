import { UNCATALOGED_WORKFLOWS } from "@repo/shared/workflow/listedWorkflows";
import { indexWorkflowsById } from "@repo/shared/workflow/utils";
import type { GetStaticPaths } from "next";
import type { WorkflowPageParams } from "./types";

/**
 * Builds getStaticPaths for the workflow detail page — one path per workflow in
 * the catalog, plus the interim workflows that have no catalog category. Typed to
 * just the workflow trsIds it reads, so the catalog JSON is accepted directly.
 * @param workflowCategories - Workflow categories exposing their workflow trsIds.
 * @returns getStaticPaths, which throws if two workflows with different trsIds
 * share a URL-formatted trsId.
 */
export function makeWorkflowStaticPaths(
  workflowCategories: { workflows: { trsId: string }[] }[]
): GetStaticPaths<WorkflowPageParams> {
  return async () => ({
    fallback: false,
    paths: Array.from(
      indexWorkflowsById(workflowCategories, UNCATALOGED_WORKFLOWS).keys(),
      (trsId) => ({ params: { trsId } })
    ),
  });
}
