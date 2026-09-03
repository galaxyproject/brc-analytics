import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  FEATURE_FLAGS,
  type FeatureFlag,
} from "@repo/shared/config/featureFlags";
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
 * Which feature flag gates which workflow category. Categories absent from this
 * map are never gated.
 */
const FEATURE_FLAG_BY_CATEGORY = {
  [WORKFLOW_CATEGORY_ID.ASSEMBLY]: FEATURE_FLAGS.ASSEMBLY_WORKFLOWS,
} as const satisfies Partial<Record<WORKFLOW_CATEGORY_ID, FeatureFlag>>;

/**
 * TRS ID prefix identifying the Hyphy workflow. A prefix rather than an exact
 * ID because the trailing segment is a version that changes with each release.
 */
const HYPHY_TRS_ID_PREFIX =
  "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/";

/**
 * Which feature flag gates which individual workflows. Workflows matched by no
 * gate are never gated.
 */
const WORKFLOW_GATES = {
  [FEATURE_FLAGS.HYPHY]: (trsId: string): boolean =>
    trsId.startsWith(HYPHY_TRS_ID_PREFIX),
  [FEATURE_FLAGS.LMLS]: isLmlsWorkflow,
} as const satisfies Partial<Record<FeatureFlag, (trsId: string) => boolean>>;

/**
 * A feature flag that gates a workflow category, derived from the gating map so
 * the set cannot drift from the flags actually in use there.
 */
type WorkflowCategoryFeatureFlag =
  (typeof FEATURE_FLAG_BY_CATEGORY)[keyof typeof FEATURE_FLAG_BY_CATEGORY];

/**
 * A feature flag that gates individual workflows, derived from the gates so the
 * set cannot drift from the flags actually in use there.
 */
type WorkflowFeatureFlag = keyof typeof WORKFLOW_GATES;

/**
 * Enabled state of every feature flag that gates workflow content, at either
 * level. Exhaustive by construction: adding a gate above is a compile error
 * wherever this record is built, so a resolver cannot silently miss a new gate
 * and leave the content it gates visible.
 */
export type WorkflowFeatureFlags = Record<
  WorkflowCategoryFeatureFlag | WorkflowFeatureFlag,
  boolean
>;

/**
 * Lookup view of the category gating map. A Map because the catalog types
 * `category` as a plain string: `get` misses cleanly for any category the map
 * doesn't hold, where indexing an object would resolve inherited members such
 * as `toString` and report a category as gated.
 */
const featureFlagByCategory = new Map<string, WorkflowCategoryFeatureFlag>(
  Object.entries(FEATURE_FLAG_BY_CATEGORY)
);

/**
 * Lookup view of the workflow gates, typed by the flags they belong to — the
 * one place the record's keys are named, so the checks below stay cast-free.
 */
const workflowGateEntries = Object.entries(WORKFLOW_GATES) as [
  WorkflowFeatureFlag,
  (trsId: string) => boolean,
][];

/**
 * Binds the gating rules to a resolved flag state. Pure, so build-time code and
 * tests bind it directly; components get the same object from
 * `useWorkflowFeatureFlags`, which resolves the flags first.
 * @param featureFlags - Enabled state of every workflow-gating feature flag.
 * @returns The gating rules, bound to the given flag state.
 */
export function bindWorkflowFeatureFlags(
  featureFlags: WorkflowFeatureFlags
): WorkflowGates {
  return {
    filterCategories: (workflowCategories) =>
      filterFlagGatedWorkflowCategories(workflowCategories, featureFlags),
    isWorkflowAllowed: (workflow) => isWorkflowEnabled(workflow, featureFlags),
  };
}

/**
 * Applies both gating levels to workflow categories: drops categories whose own
 * feature flag is disabled, and drops the gated workflows within those that
 * remain.
 * @param workflowCategories - Workflow categories.
 * @param featureFlags - Enabled state of every workflow-gating feature flag.
 * @returns Workflow categories visible under the given flag state.
 */
function filterFlagGatedWorkflowCategories(
  workflowCategories: WorkflowCategory[],
  featureFlags: WorkflowFeatureFlags
): WorkflowCategory[] {
  const visibleCategories: WorkflowCategory[] = [];
  for (const workflowCategory of workflowCategories) {
    if (!isWorkflowCategoryEnabled(workflowCategory.category, featureFlags))
      continue;
    const workflows = workflowCategory.workflows ?? [];
    const visibleWorkflows = workflows.filter((workflow) =>
      isWorkflowEnabled(workflow, featureFlags)
    );
    // A category left empty by its workflows' own gates is gated in effect, so
    // it goes too. One that arrived empty is a "coming soon" placeholder the
    // views render deliberately, so it stays for them to decide on.
    if (workflows.length > 0 && visibleWorkflows.length === 0) continue;
    visibleCategories.push(
      visibleWorkflows.length === workflows.length
        ? workflowCategory
        : { ...workflowCategory, workflows: visibleWorkflows }
    );
  }
  return visibleCategories;
}

/**
 * Determines whether a workflow category's gating feature flag (if it has one)
 * is enabled.
 * @param category - Workflow category ID.
 * @param featureFlags - Enabled state of every workflow-gating feature flag.
 * @returns True when the category is visible under the given flag state.
 */
function isWorkflowCategoryEnabled(
  category: string,
  featureFlags: WorkflowFeatureFlags
): boolean {
  // A category absent from the map is ungated.
  const featureFlag = featureFlagByCategory.get(category);
  return featureFlag === undefined || featureFlags[featureFlag];
}

/**
 * Determines whether an individual workflow's gating feature flag (if it has
 * one) is enabled. Independent of its category's gate: a workflow in a visible
 * category can still be gated in its own right.
 * @param workflow - Workflow to check.
 * @param workflow.trsId - TRS ID of the workflow.
 * @param featureFlags - Enabled state of every workflow-gating feature flag.
 * @returns True when the workflow is visible under the given flag state.
 */
function isWorkflowEnabled(
  { trsId }: GatedWorkflow,
  featureFlags: WorkflowFeatureFlags
): boolean {
  return workflowGateEntries.every(
    ([featureFlag, matches]) => !matches(trsId) || featureFlags[featureFlag]
  );
}
