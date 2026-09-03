import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { WorkflowCategoryId } from "../../catalog/schema/generated/schema";
import { buildWorkflowCategory, buildWorkflowGates } from "./gates";

const HYPHY_TRS_ID =
  "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/v0-2";
const UNGATED_TRS_ID = "#workflow/github.com/iwc-workflows/something/main";

describe("filterCategories - category gating", () => {
  const GATED = buildWorkflowCategory(WorkflowCategoryId.ASSEMBLY, [
    UNGATED_TRS_ID,
  ]);
  const UNGATED = buildWorkflowCategory(WorkflowCategoryId.VARIANT_CALLING, [
    UNGATED_TRS_ID,
  ]);
  // The catalog types `category` as a plain string, so a value outside the enum
  // can reach the filter.
  const UNKNOWN = buildWorkflowCategory("NOT_A_CATEGORY", [UNGATED_TRS_ID]);

  it("returns a gated category when its feature flag is enabled", () => {
    const { filterCategories } = buildWorkflowGates({
      [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
    });
    expect(filterCategories([GATED])).toEqual([GATED]);
  });

  it("filters out a gated category when its feature flag is disabled", () => {
    expect(buildWorkflowGates().filterCategories([GATED])).toEqual([]);
  });

  it("returns categories named after an inherited object member", () => {
    // Nothing in the schema produces these, but the lookup must miss rather
    // than resolve `Object.prototype` and report the category as gated.
    const inherited = ["toString", "constructor", "__proto__"].map((category) =>
      buildWorkflowCategory(category, [UNGATED_TRS_ID])
    );
    expect(buildWorkflowGates().filterCategories(inherited)).toEqual(inherited);
  });

  it("returns categories that no feature flag gates, whatever the flag state", () => {
    expect(buildWorkflowGates().filterCategories([UNGATED, UNKNOWN])).toEqual([
      UNGATED,
      UNKNOWN,
    ]);
  });

  it("filters only the gated categories, preserving order", () => {
    expect(
      buildWorkflowGates().filterCategories([UNGATED, GATED, UNKNOWN])
    ).toEqual([UNGATED, UNKNOWN]);
  });

  it("returns an empty list unchanged", () => {
    const { filterCategories } = buildWorkflowGates({
      [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
    });
    expect(filterCategories([])).toEqual([]);
  });
});

describe("filterCategories - workflow gating within a category", () => {
  it("drops a gated workflow from an otherwise visible category", () => {
    const category = buildWorkflowCategory(WorkflowCategoryId.OTHER, [
      UNGATED_TRS_ID,
      HYPHY_TRS_ID,
    ]);
    expect(buildWorkflowGates().filterCategories([category])).toEqual([
      { ...category, workflows: [{ trsId: UNGATED_TRS_ID }] },
    ]);
  });

  it("drops a category left empty by its workflows' own gates", () => {
    // The organism page's Comparative Genomics case: the category carries no
    // gate of its own, but every workflow in it is gated, so showing the
    // category would surface gated content under a different heading.
    const category = buildWorkflowCategory(
      WorkflowCategoryId.COMPARATIVE_GENOMICS,
      [HYPHY_TRS_ID]
    );
    expect(buildWorkflowGates().filterCategories([category])).toEqual([]);
    expect(
      buildWorkflowGates({ [FEATURE_FLAGS.HYPHY]: true }).filterCategories([
        category,
      ])
    ).toEqual([category]);
  });

  it("keeps a category that arrived empty", () => {
    // A "coming soon" placeholder: nothing was gated away, so the view decides.
    const category = buildWorkflowCategory(WorkflowCategoryId.OTHER);
    expect(buildWorkflowGates().filterCategories([category])).toEqual([
      category,
    ]);
  });

  it("returns the original category object when nothing is gated away", () => {
    const category = buildWorkflowCategory(WorkflowCategoryId.OTHER, [
      UNGATED_TRS_ID,
    ]);
    expect(buildWorkflowGates().filterCategories([category])[0]).toBe(category);
  });
});
