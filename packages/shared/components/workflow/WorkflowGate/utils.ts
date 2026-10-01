import {
  findWorkflow,
  findWorkflowCategories,
} from "@repo/shared/services/workflows/entities";
import type { GatedWorkflow } from "@repo/shared/workflow/gates";

/**
 * Resolves the TRS ID from a URL to the workflow the gating rules read: the
 * workflow's raw catalog TRS ID — the rules match on that, not the URL form —
 * and the IDs of every catalog category holding it, none for a workflow outside
 * the catalog. Requires the workflows cache to be loaded.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @returns The gated workflow, or undefined when the TRS ID names no workflow.
 */
export function resolveGatedWorkflow(trsId: string): GatedWorkflow | undefined {
  const workflow = findWorkflow(trsId);
  if (!workflow) return undefined;
  return {
    categoryIds: findWorkflowCategories(workflow.trsId).map(
      ({ category }) => category
    ),
    trsId: workflow.trsId,
  };
}
