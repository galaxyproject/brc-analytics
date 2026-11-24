import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";
import {
  buildWorkflowCategory,
  buildWorkflowGates,
  HYPHY_TRS_ID,
  UNGATED_TRS_ID,
} from "./gates";

describe("filterCategories", () => {
  it("keeps every category, including Assembly, with the demo flag off", () => {
    const categories = [
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [UNGATED_TRS_ID]),
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.COMPARATIVE_GENOMICS, [
        HYPHY_TRS_ID,
      ]),
    ];
    expect(buildWorkflowGates().filterCategories(categories)).toEqual(
      categories
    );
  });

  it("drops a gated workflow from its category", () => {
    const category = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
      UNGATED_TRS_ID,
      LOGAN_SEARCH,
    ]);
    const [ungatedWorkflow] = category.workflows;
    expect(buildWorkflowGates().filterCategories([category])).toEqual([
      { ...category, workflows: [ungatedWorkflow] },
    ]);
  });

  it("empties, but keeps, a category whose workflows are all gated", () => {
    // It comes back empty for the view to decide on, the same as one that
    // arrived empty.
    const category = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
      LOGAN_SEARCH,
    ]);
    expect(buildWorkflowGates().filterCategories([category])).toEqual([
      { ...category, workflows: [] },
    ]);
    expect(buildWorkflowGates(true).filterCategories([category])).toEqual([
      category,
    ]);
  });

  it("keeps a category that arrived empty", () => {
    // A "coming soon" placeholder: nothing was gated away, so the view decides.
    const category = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER);
    expect(buildWorkflowGates().filterCategories([category])).toEqual([
      category,
    ]);
  });

  it("returns the original category object when nothing is gated away", () => {
    const category = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
      UNGATED_TRS_ID,
    ]);
    expect(buildWorkflowGates().filterCategories([category])[0]).toBe(category);
  });

  it("returns an empty list unchanged", () => {
    expect(buildWorkflowGates(true).filterCategories([])).toEqual([]);
  });
});
