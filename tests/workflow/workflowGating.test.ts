import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@repo/shared/workflow/differentialExpressionAnalysis";
import { LMLS_WORKFLOWS } from "@repo/shared/workflow/lmls";
import {
  buildWorkflow,
  buildWorkflowCategory,
  buildWorkflowGates,
  HYPHY_TRS_ID,
  UNGATED_TRS_ID,
} from "./gates";

const HYPHY = buildWorkflow(HYPHY_TRS_ID);
const UNGATED = buildWorkflow(UNGATED_TRS_ID);

describe("filterWorkflows", () => {
  it("keeps a workflow that no gate matches, whatever the flag state", () => {
    for (const gates of [buildWorkflowGates(), buildWorkflowGates(true)]) {
      expect(gates.filterWorkflows([UNGATED])).toEqual([UNGATED]);
    }
  });

  it("keeps the Hyphy workflow with the demo flag off", () => {
    expect(buildWorkflowGates().filterWorkflows([HYPHY])).toEqual([HYPHY]);
  });

  it("gates every LMLS workflow on the demo flag", () => {
    expect(buildWorkflowGates().filterWorkflows(LMLS_WORKFLOWS)).toEqual([]);
    expect(buildWorkflowGates(true).filterWorkflows(LMLS_WORKFLOWS)).toEqual(
      LMLS_WORKFLOWS
    );
  });

  it("keeps Differential Expression Analysis", () => {
    expect(
      buildWorkflowGates().filterWorkflows([DIFFERENTIAL_EXPRESSION_ANALYSIS])
    ).toEqual([DIFFERENTIAL_EXPRESSION_ANALYSIS]);
  });
});

describe("bindWorkflowGates", () => {
  it("closes every gate when the demo flag is off and opens them all when it is on", () => {
    // The single-flag guarantee, asserted in both directions: the off half
    // pins that each gated workflow is actually held back, the on half that
    // the one flag releases all of them — through both methods.
    const category = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
      UNGATED,
      ...LMLS_WORKFLOWS,
    ]);

    const disabled = buildWorkflowGates();
    expect(disabled.filterWorkflows(LMLS_WORKFLOWS)).toEqual([]);
    expect(disabled.filterCategories([category])).toEqual([
      { ...category, workflows: [UNGATED] },
    ]);

    const enabled = buildWorkflowGates(true);
    expect(enabled.filterWorkflows(LMLS_WORKFLOWS)).toEqual(LMLS_WORKFLOWS);
    expect(enabled.filterCategories([category])).toEqual([category]);
  });

  it("returns the same rules for a given flag state", () => {
    // Callers hold the result as a memo dependency instead of memoizing it, so
    // a build-per-call would silently recompute over the whole catalog.
    expect(buildWorkflowGates(true)).toBe(buildWorkflowGates(true));
    expect(buildWorkflowGates()).toBe(buildWorkflowGates());
  });

  it("hands back a copy, so a caller cannot reorder the array it was given", () => {
    // Both flag states: the views filter prerendered page props, so neither
    // path may return the caller's own array.
    const categories = [buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER)];
    const workflows = [UNGATED];
    for (const gates of [buildWorkflowGates(), buildWorkflowGates(true)]) {
      expect(gates.filterCategories(categories)).not.toBe(categories);
      expect(gates.filterWorkflows(workflows)).not.toBe(workflows);
    }
  });
});
