import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  DIFFERENTIAL_EXPRESSION_ANALYSIS,
  DIFFERENTIAL_EXPRESSION_ANALYSIS_CATEGORY,
} from "@repo/shared/workflow/differentialExpressionAnalysis";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import {
  LMLS_WORKFLOW_CATEGORY,
  LMLS_WORKFLOWS,
} from "@repo/shared/workflow/lmls";
import { categoriesIncludeWorkflow } from "@repo/shared/workflow/utils";

/**
 * Workflows the workflows listing offers from outside the catalog, under the
 * category they are listed and gated under.
 */
export interface UncatalogedWorkflowGroup {
  category: string;
  name: string;
  workflows: readonly Workflow[];
}

/**
 * The workflows the workflows listing appends to the catalog's own: Differential
 * Expression Analysis (an interim measure) and the Sequence Analysis workflows.
 * Declared once, so the listing, the workflow detail pages and the workflows
 * store agree on which exist and the category each is gated under.
 */
export const UNCATALOGED_WORKFLOW_GROUPS: readonly UncatalogedWorkflowGroup[] =
  [
    {
      category: DIFFERENTIAL_EXPRESSION_ANALYSIS_CATEGORY,
      name: "Transcriptomics",
      workflows: [DIFFERENTIAL_EXPRESSION_ANALYSIS],
    },
    {
      category: LMLS_WORKFLOW_CATEGORY,
      name: "Sequence Analysis",
      workflows: LMLS_WORKFLOWS,
    },
  ];

/**
 * Every workflow the workflows listing appends to the catalog's own — the ones
 * the workflow detail page prerenders and the store indexes beside the catalog.
 */
export const UNCATALOGED_WORKFLOWS: readonly Workflow[] =
  UNCATALOGED_WORKFLOW_GROUPS.flatMap(({ workflows }) => workflows);

/**
 * Determines whether a workflow is one the workflows listing offers under the
 * given gates: a catalog workflow in a category the gates keep, or an
 * uncataloged workflow its group's category gate keeps. Does not apply the
 * listing's minimum compatible-assembly count, which needs the fetched
 * workflow-assembly mappings and concerns entity fit rather than gating.
 * @param workflow - Workflow.
 * @param workflowCategories - Catalog workflow categories.
 * @param workflowGates - Feature-flag gating rules bound to the user's flag state.
 * @returns True when the workflows listing offers the workflow.
 */
export function isWorkflowListed(
  workflow: Workflow,
  workflowCategories: WorkflowCategory[],
  workflowGates: WorkflowGates
): boolean {
  if (
    categoriesIncludeWorkflow(
      workflowGates.filterCategories(workflowCategories),
      workflow
    )
  )
    return true;
  return UNCATALOGED_WORKFLOW_GROUPS.some(({ category, workflows }) =>
    workflowGates
      .filterWorkflows(category, workflows)
      .some(({ trsId }) => trsId === workflow.trsId)
  );
}
