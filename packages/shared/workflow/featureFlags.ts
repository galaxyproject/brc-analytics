import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  FEATURE_FLAGS,
  type FeatureFlag,
} from "@repo/shared/config/featureFlags";

/**
 * Which feature flag gates which workflow category, for the views that resolve
 * their flag state through `useWorkflowCategoryFeatureFlags`. Categories absent
 * from this map are never gated.
 *
 * Not yet the only place the rule lives: `getWorkflows` and
 * `buildAssemblyWorkflows` still carry their own inline checks, so a category
 * added here is gated on the organism page alone until those views resolve
 * their flags through this module too.
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
 * A feature flag that gates a workflow category, derived from the gating map so
 * the set cannot drift from the flags actually in use there.
 */
export type WorkflowCategoryFeatureFlag =
  (typeof FEATURE_FLAG_BY_CATEGORY)[keyof typeof FEATURE_FLAG_BY_CATEGORY];

/**
 * Enabled state of every feature flag that gates a workflow category.
 * Exhaustive by construction: gating a category above is a compile error
 * wherever this record is built, so a resolver cannot silently miss a new gate.
 */
export type WorkflowCategoryFeatureFlags = Record<
  WorkflowCategoryFeatureFlag,
  boolean
>;

/**
 * Filters out workflow categories whose gating feature flag is disabled.
 * @param workflowCategories - Workflow categories.
 * @param featureFlags - Enabled state of every category-gating feature flag.
 * @returns Workflow categories visible under the given flag state.
 */
export function filterFlagGatedWorkflowCategories(
  workflowCategories: WorkflowCategory[],
  featureFlags: WorkflowCategoryFeatureFlags
): WorkflowCategory[] {
  return workflowCategories.filter(({ category }) =>
    isWorkflowCategoryEnabled(category, featureFlags)
  );
}

/**
 * Determines whether a workflow category's gating feature flag (if it has one)
 * is enabled.
 * @param category - Workflow category ID.
 * @param featureFlags - Enabled state of every category-gating feature flag.
 * @returns True when the category is visible under the given flag state.
 */
function isWorkflowCategoryEnabled(
  category: string,
  featureFlags: WorkflowCategoryFeatureFlags
): boolean {
  // A category absent from the map is ungated.
  const featureFlag = featureFlagByCategory.get(category);
  return featureFlag === undefined || featureFlags[featureFlag];
}
