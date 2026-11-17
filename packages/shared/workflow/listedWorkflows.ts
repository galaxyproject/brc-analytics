import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import type { WorkflowGates } from "@repo/shared/workflow/gates";
import { LMLS_WORKFLOWS } from "@repo/shared/workflow/lmls";
import { categoriesIncludeWorkflow } from "@repo/shared/workflow/utils";

/**
 * Workflows the workflows listing offers from outside the catalog, under the
 * category name they are listed with.
 */
export interface UncatalogedWorkflowGroup {
  name: string;
  workflows: readonly Workflow[];
}

/**
 * The workflows the workflows listing appends to the catalog's own: Differential
 * Expression Analysis (an interim measure) and the Sequence Analysis workflows.
 * Declared once, so the listing, the workflow detail pages and the workflows
 * store agree on which exist.
 */
export const UNCATALOGED_WORKFLOW_GROUPS: readonly UncatalogedWorkflowGroup[] =
  [
    {
      name: "Transcriptomics",
      workflows: [DIFFERENTIAL_EXPRESSION_ANALYSIS],
    },
    {
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
 * given gates: a catalog or uncataloged workflow the gates keep. Does not apply the
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
  return workflowGates
    .filterWorkflows(UNCATALOGED_WORKFLOWS)
    .some(({ trsId }) => trsId === workflow.trsId);
}
