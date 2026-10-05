import {
  WORKFLOW_PLOIDY,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
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
 * Builds a workflow with the given TRS ID: one that fits any entity (no
 * taxonomy, any ploidy, no parameters), so a test changes only the fields it is
 * about.
 * @param trsId - TRS ID of the workflow.
 * @param overrides - Fields to set on the workflow.
 * @returns Workflow.
 */
export function buildWorkflow(
  trsId: string,
  overrides: Partial<Workflow> = {}
): Workflow {
  return {
    assemblyCountMax: 1,
    assemblyCountMin: 1,
    iwcId: "",
    parameters: [],
    ploidy: WORKFLOW_PLOIDY.ANY,
    scope: WORKFLOW_SCOPE.ASSEMBLY,
    taxonomyId: null,
    trsId,
    workflowDescription: "desc",
    workflowName: trsId,
    ...overrides,
  };
}

/**
 * Builds a workflow category with the given ID and workflows. Workflows given
 * by TRS ID are built with `buildWorkflow` and the given scope.
 * @param category - Workflow category ID.
 * @param workflows - The category's workflows, or their TRS IDs.
 * @param scope - Scope of the workflows given by TRS ID.
 * @returns Workflow category.
 */
export function buildWorkflowCategory(
  category: string,
  workflows: (string | Workflow)[] = [],
  scope: WORKFLOW_SCOPE = WORKFLOW_SCOPE.ASSEMBLY
): WorkflowCategory {
  return {
    category,
    description: "desc",
    name: category.toLowerCase(),
    showComingSoon: false,
    workflows: workflows.map((workflow) =>
      typeof workflow === "string"
        ? buildWorkflow(workflow, { scope })
        : workflow
    ),
  };
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
