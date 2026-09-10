import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import { isLmlsWorkflow } from "@repo/shared/workflow/lmls";

/**
 * A workflow whose visibility can be decided from its TRS ID alone — the only
 * field the gating rules read, so callers can pass a full workflow or a stub.
 */
export interface GatedWorkflow {
  trsId: string;
}

/**
 * The gating rules bound to a resolved flag state — the single answer to "may
 * this be shown". Each method is complete for what it takes: `filterCategories`
 * applies the category and the workflow rules together, so a caller holding
 * categories cannot apply half the rule.
 */
export interface WorkflowGates {
  filterCategories: (
    workflowCategories: WorkflowCategory[]
  ) => WorkflowCategory[];
  isWorkflowAllowed: (workflow: GatedWorkflow) => boolean;
}

/**
 * The rules with the demo-gated content held back.
 */
const DEMO_DISABLED_GATES: WorkflowGates = {
  filterCategories: filterDemoGatedCategories,
  isWorkflowAllowed: (workflow) => !isDemoGatedWorkflow(workflow),
};

/**
 * The rules with nothing gated — what the demo binds to, so "the demo shows
 * everything" is one object rather than a condition inside every rule.
 * `filterCategories` still copies, so no caller can reorder the array it was
 * handed (page props, in the views that filter prerendered categories).
 */
const DEMO_ENABLED_GATES: WorkflowGates = {
  filterCategories: (workflowCategories) => [...workflowCategories],
  isWorkflowAllowed: () => true,
};

/**
 * The demo-gated workflow categories — one of the two places gated workflow
 * content is named, so nothing is gated by an ad-hoc check at a call site.
 * Categories absent from this set are never gated.
 *
 * A set of strings rather than of category IDs because the catalog types
 * `category` as a plain string, so a value outside the enum can reach the
 * lookup and has to miss cleanly.
 */
const DEMO_GATED_CATEGORIES: ReadonlySet<string> = new Set([
  WORKFLOW_CATEGORY_ID.ASSEMBLY,
]);

/**
 * The demo-gated individual workflows, named by the rules matching their TRS
 * IDs — the other of the two places gated workflow content is named. A workflow
 * matched by no rule is never gated.
 */
const DEMO_GATED_WORKFLOWS: readonly ((trsId: string) => boolean)[] = [
  isHyphyWorkflow,
  isLmlsWorkflow,
];

/**
 * TRS ID prefix identifying the Hyphy workflow. A prefix rather than an exact
 * ID because the trailing segment is a version that changes with each release.
 */
const HYPHY_TRS_ID_PREFIX =
  "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/";

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
 * Applies both gating levels to workflow categories: drops the gated
 * categories, and drops the gated workflows within those that remain. A
 * category left with no workflows is kept — whether an empty category is hidden
 * or shown as a placeholder is the consuming view's call, and gating hands it
 * the same empty category as any other reason one ends up empty.
 * @param workflowCategories - Workflow categories.
 * @returns The workflow categories that are not demo gated.
 */
function filterDemoGatedCategories(
  workflowCategories: WorkflowCategory[]
): WorkflowCategory[] {
  const visibleCategories: WorkflowCategory[] = [];
  for (const workflowCategory of workflowCategories) {
    if (isDemoGatedCategory(workflowCategory.category)) continue;
    const { workflows } = workflowCategory;
    const visibleWorkflows = workflows.filter(
      (workflow) => !isDemoGatedWorkflow(workflow)
    );
    visibleCategories.push(
      visibleWorkflows.length === workflows.length
        ? workflowCategory
        : { ...workflowCategory, workflows: visibleWorkflows }
    );
  }
  return visibleCategories;
}

/**
 * Determines whether a workflow category is one the demo gates.
 * @param category - Workflow category ID.
 * @returns True when the category is demo gated.
 */
function isDemoGatedCategory(category: string): boolean {
  return DEMO_GATED_CATEGORIES.has(category);
}

/**
 * Determines whether an individual workflow is one the demo gates. Independent
 * of its category's gate: a workflow in an ungated category can still be gated
 * in its own right.
 * @param workflow - Workflow to check.
 * @param workflow.trsId - TRS ID of the workflow.
 * @returns True when the workflow is demo gated.
 */
function isDemoGatedWorkflow({ trsId }: GatedWorkflow): boolean {
  return DEMO_GATED_WORKFLOWS.some((matches) => matches(trsId));
}

/**
 * Determines whether a TRS ID identifies the Hyphy workflow.
 * @param trsId - TRS ID of the workflow.
 * @returns True when the TRS ID is the Hyphy workflow's.
 */
function isHyphyWorkflow(trsId: string): boolean {
  return trsId.startsWith(HYPHY_TRS_ID_PREFIX);
}
