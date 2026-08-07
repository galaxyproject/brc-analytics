import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import { LEXICMAP } from "@repo/shared/workflow/lexicmap";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";
import { formatTrsId } from "@repo/shared/workflow/utils";
import type { GetStaticPaths, GetStaticPathsResult } from "next";
import type { WorkflowPageParams } from "./types";

/**
 * Builds getStaticPaths for the workflow detail page — one path per workflow in
 * the catalog, plus the interim workflows that have no catalog category. Typed to
 * just the workflow trsIds it reads, so the catalog JSON is accepted directly.
 * @param workflowCategories - Workflow categories exposing their workflow trsIds.
 * @returns getStaticPaths.
 */
export function makeWorkflowStaticPaths(
  workflowCategories: { workflows: { trsId: string }[] }[]
): GetStaticPaths<WorkflowPageParams> {
  return async () => {
    const paths: GetStaticPathsResult<WorkflowPageParams>["paths"] = [];

    for (const { workflows } of workflowCategories) {
      for (const { trsId } of workflows) {
        paths.push({ params: { trsId: formatTrsId(trsId) } });
      }
    }

    // Interim workflows without a catalog category.
    for (const { trsId } of [
      DIFFERENTIAL_EXPRESSION_ANALYSIS,
      LOGAN_SEARCH,
      LEXICMAP,
    ]) {
      paths.push({ params: { trsId: formatTrsId(trsId) } });
    }

    return { fallback: false, paths };
  };
}
