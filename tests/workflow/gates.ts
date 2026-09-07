import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import {
  bindWorkflowGates,
  type WorkflowGates,
} from "@repo/shared/workflow/gates";

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
 * Builds workflow gating rules for a test, with the demo flag disabled unless
 * the test enables it.
 * @param isDemoEnabled - Whether the demo feature flag is enabled.
 * @returns Gating rules bound to the given flag state.
 */
export function buildWorkflowGates(isDemoEnabled = false): WorkflowGates {
  return bindWorkflowGates(isDemoEnabled);
}
