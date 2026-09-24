import { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { indexWorkflowsById } from "@repo/shared/services/workflows/loader";
import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesById,
  setEntitiesByType,
} from "@repo/shared/services/workflows/store";
import {
  bindWorkflowGates,
  type WorkflowGates,
} from "@repo/shared/workflow/gates";

export const HYPHY_TRS_ID =
  "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/v0.2";
export const UNGATED_TRS_ID =
  "#workflow/github.com/iwc-workflows/something/main";

/**
 * Builds a workflow category with the given ID and workflows. Only `category`
 * and each workflow's `trsId` and `scope` are read by the gating rules, so the
 * rest are placeholders.
 * @param category - Workflow category ID.
 * @param trsIds - TRS IDs of the category's workflows.
 * @param scope - Scope of the category's workflows.
 * @returns Workflow category.
 */
export function buildWorkflowCategory(
  category: string,
  trsIds: string[] = [],
  scope: WORKFLOW_SCOPE = WORKFLOW_SCOPE.ASSEMBLY
): WorkflowCategory {
  return {
    category,
    description: "desc",
    name: category.toLowerCase(),
    showComingSoon: false,
    workflows: trsIds.map((trsId) => ({ scope, trsId })),
  } as WorkflowCategory;
}

/**
 * Binds the workflow gating rules, defaulting the demo flag to disabled so a
 * test naming no flag state reads as the gated one.
 * @param isDemoEnabled - Whether the demo feature flag is enabled.
 * @returns Gating rules bound to the given flag state.
 */
export function buildWorkflowGates(isDemoEnabled = false): WorkflowGates {
  return bindWorkflowGates(isDemoEnabled);
}

/**
 * Seeds the workflows store as the loader does, indexing catalog and extra
 * workflows with the loader's own rules. Clears whatever was loaded before.
 * @param categories - Catalog workflow categories to load.
 * @param extraWorkflows - Workflows outside the catalog to load.
 */
export function seedWorkflowsStore(
  categories: WorkflowCategory[],
  extraWorkflows: Workflow[] = []
): void {
  getEntitiesById().clear();
  getEntitiesByType().clear();
  setEntitiesById("workflows", indexWorkflowsById(categories, extraWorkflows));
  setEntitiesByType("workflows", categories);
}
