import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  bindWorkflowFeatureFlags,
  type WorkflowFeatureFlags,
  type WorkflowGates,
} from "@repo/shared/workflow/featureFlags";

/**
 * Every workflow-gating feature flag, disabled. Exhaustive by construction, so
 * adding a gate is a compile error here — the one place the test suite has to
 * decide what a new gate defaults to.
 */
const ALL_DISABLED: WorkflowFeatureFlags = {
  [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: false,
  [FEATURE_FLAGS.HYPHY]: false,
  [FEATURE_FLAGS.LMLS]: false,
};

/**
 * Builds a workflow category with the given ID and workflows. Only `category`
 * and `workflows` are read by the gating rules, so the rest are placeholders.
 * @param category - Workflow category ID.
 * @param trsIds - TRS IDs of the category's workflows.
 * @returns Workflow category.
 */
export function buildWorkflowCategory(
  category: string,
  trsIds: string[] = []
): WorkflowCategory {
  return {
    category,
    description: "desc",
    name: category.toLowerCase(),
    showComingSoon: false,
    workflows: trsIds.map((trsId) => ({ trsId })),
  } as WorkflowCategory;
}

/**
 * Builds workflow gating rules for a test, with every flag disabled unless the
 * test names it.
 * @param featureFlags - Flags to enable for this test.
 * @returns Gating rules bound to the given flag state.
 */
export function buildWorkflowGates(
  featureFlags: Partial<WorkflowFeatureFlags> = {}
): WorkflowGates {
  return bindWorkflowFeatureFlags({ ...ALL_DISABLED, ...featureFlags });
}
