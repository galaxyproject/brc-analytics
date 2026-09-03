import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  FEATURE_FLAGS,
  type FeatureFlag,
} from "@repo/shared/config/featureFlags";
import { LEXICMAP } from "@repo/shared/workflow/lexicmap";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";

/**
 * A workflow whose visibility can be decided from its TRS ID alone — the only
 * field the gating rules read, so callers can pass a full workflow or a stub.
 */
interface GatedWorkflow {
  trsId: string;
}

/**
 * Rule matching the workflows a single feature flag gates.
 */
interface WorkflowGate {
  featureFlag: FeatureFlag;
  matches: (trsId: string) => boolean;
}

/**
 * Which feature flag gates which workflow category. Categories absent from this
 * map are never gated.
 */
const FEATURE_FLAG_BY_CATEGORY = {
  [WORKFLOW_CATEGORY_ID.ASSEMBLY]: FEATURE_FLAGS.ASSEMBLY_WORKFLOWS,
} as const satisfies Partial<Record<WORKFLOW_CATEGORY_ID, FeatureFlag>>;

/**
 * Lookup view of the gating map. A Map because the catalog types `category` as
 * a plain string: `get` misses cleanly for any category the map doesn't hold,
 * where indexing an object would resolve inherited members such as `toString`
 * and report a category as gated.
 */
const featureFlagByCategory = new Map<string, WorkflowCategoryFeatureFlag>(
  Object.entries(FEATURE_FLAG_BY_CATEGORY)
);

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
const WORKFLOW_GATES = [
  {
    featureFlag: FEATURE_FLAGS.HYPHY,
    matches: (trsId: string): boolean => trsId.startsWith(HYPHY_TRS_ID_PREFIX),
  },
  {
    featureFlag: FEATURE_FLAGS.LMLS,
    matches: (trsId: string): boolean =>
      trsId === LEXICMAP.trsId || trsId === LOGAN_SEARCH.trsId,
  },
] as const satisfies readonly WorkflowGate[];

/**
 * A feature flag that gates a workflow category, derived from the gating map so
 * the set cannot drift from the flags actually in use there.
 */
export type WorkflowCategoryFeatureFlag =
  (typeof FEATURE_FLAG_BY_CATEGORY)[keyof typeof FEATURE_FLAG_BY_CATEGORY];

/**
 * A feature flag that gates individual workflows, derived from the gates so the
 * set cannot drift from the flags actually in use there.
 */
export type WorkflowFeatureFlag =
  (typeof WORKFLOW_GATES)[number]["featureFlag"];

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
 * The gating rules bound to a resolved flag state — the single answer to "may
 * this content be shown", at both the category and the workflow level.
 */
export interface WorkflowGates {
  filterCategories: (
    workflowCategories: WorkflowCategory[]
  ) => WorkflowCategory[];
  isWorkflowAllowed: (workflow: GatedWorkflow) => boolean;
}

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
 * Filters out workflow categories whose gating feature flag is disabled.
 * @param workflowCategories - Workflow categories.
 * @param featureFlags - Enabled state of every workflow-gating feature flag.
 * @returns Workflow categories visible under the given flag state.
 */
export function filterFlagGatedWorkflowCategories(
  workflowCategories: WorkflowCategory[],
  featureFlags: WorkflowFeatureFlags
): WorkflowCategory[] {
  return workflowCategories.filter(({ category }) =>
    isWorkflowCategoryEnabled(category, featureFlags)
  );
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
export function isWorkflowEnabled(
  { trsId }: GatedWorkflow,
  featureFlags: WorkflowFeatureFlags
): boolean {
  return WORKFLOW_GATES.every(
    ({ featureFlag, matches }) => !matches(trsId) || featureFlags[featureFlag]
  );
}
