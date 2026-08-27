import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import type { WorkflowCategory } from "@repo/shared/apis/workflow";

/**
 * Feature flags that gate a workflow category's visibility.
 */
export const WORKFLOW_CATEGORY_FEATURE_FLAG = {
  ASSEMBLY_WORKFLOWS: "assembly-workflows",
} as const;

export type WorkflowCategoryFeatureFlag =
  (typeof WORKFLOW_CATEGORY_FEATURE_FLAG)[keyof typeof WORKFLOW_CATEGORY_FEATURE_FLAG];

/**
 * Enabled state of every feature flag that gates a workflow category.
 * Exhaustive by construction: adding a flag above is a compile error at every
 * site that resolves flag state, so no consumer can silently miss a new gate.
 */
export type WorkflowCategoryFeatureFlags = Record<
  WorkflowCategoryFeatureFlag,
  boolean
>;

/**
 * The single owner of which feature flag gates which workflow category.
 * Categories absent from this map are never gated.
 */
const FEATURE_FLAG_BY_CATEGORY: Partial<
  Record<WORKFLOW_CATEGORY_ID, WorkflowCategoryFeatureFlag>
> = {
  [WORKFLOW_CATEGORY_ID.ASSEMBLY]:
    WORKFLOW_CATEGORY_FEATURE_FLAG.ASSEMBLY_WORKFLOWS,
};

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
export function isWorkflowCategoryEnabled(
  category: string,
  featureFlags: WorkflowCategoryFeatureFlags
): boolean {
  // The catalog types `category` as a plain string, so narrow for the lookup:
  // a value outside the enum simply misses the map and is treated as ungated.
  const featureFlag =
    FEATURE_FLAG_BY_CATEGORY[category as WORKFLOW_CATEGORY_ID];
  return featureFlag === undefined || featureFlags[featureFlag];
}
