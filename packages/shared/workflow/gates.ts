import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { isLmlsWorkflow } from "@repo/shared/workflow/lmls";

/**
 * The gating rules bound to a resolved flag state — the single answer to "may
 * this be shown". Gating is per workflow: `filterCategories` drops the gated
 * workflows from each category, and `filterWorkflows` from a list of workflows
 * declared outside the catalog, so both apply the same rule.
 */
export interface WorkflowGates {
  filterCategories: (
    workflowCategories: WorkflowCategory[]
  ) => WorkflowCategory[];
  filterWorkflows: (workflows: readonly Workflow[]) => Workflow[];
}

/**
 * The rules with the demo-gated workflows held back.
 */
const DEMO_DISABLED_GATES: WorkflowGates = {
  filterCategories: filterDemoGatedCategories,
  filterWorkflows: filterDemoGatedWorkflows,
};

/**
 * The rules with nothing gated — what the demo binds to, so "the demo shows
 * everything" is one object rather than a condition inside every rule. Both
 * methods still copy, so no caller can reorder the array it was handed (page
 * props, in the views that filter prerendered categories).
 */
const DEMO_ENABLED_GATES: WorkflowGates = {
  filterCategories: (workflowCategories) => [...workflowCategories],
  filterWorkflows: (workflows) => [...workflows],
};

/**
 * Binds the gating rules to a resolved flag state. Returns one of two stable
 * objects, so a caller can hold the result as a dependency without memoizing.
 * @param isDemoEnabled - Whether the demo feature flag is enabled.
 * @returns The gating rules for the given flag state.
 */
export function bindWorkflowGates(isDemoEnabled: boolean): WorkflowGates {
  return isDemoEnabled ? DEMO_ENABLED_GATES : DEMO_DISABLED_GATES;
}

/**
 * Drops the demo-gated workflows from each workflow category. A category left
 * with no workflows is kept — whether an empty category is hidden or shown as a
 * placeholder is the consuming view's call, and gating hands it the same empty
 * category as any other reason one ends up empty.
 * @param workflowCategories - Workflow categories.
 * @returns The workflow categories, without their demo-gated workflows.
 */
function filterDemoGatedCategories(
  workflowCategories: WorkflowCategory[]
): WorkflowCategory[] {
  return workflowCategories.map((workflowCategory) => {
    const { workflows } = workflowCategory;
    const visibleWorkflows = filterDemoGatedWorkflows(workflows);
    return visibleWorkflows.length === workflows.length
      ? workflowCategory
      : { ...workflowCategory, workflows: visibleWorkflows };
  });
}

/**
 * Drops the demo-gated workflows: the LMLS workflows, the only workflows the
 * demo gates.
 * @param workflows - Workflows.
 * @returns The workflows that are not demo gated.
 */
function filterDemoGatedWorkflows(workflows: readonly Workflow[]): Workflow[] {
  return workflows.filter(({ trsId }) => !isLmlsWorkflow(trsId));
}
