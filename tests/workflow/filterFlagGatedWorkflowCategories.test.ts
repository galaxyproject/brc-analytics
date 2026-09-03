import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { filterFlagGatedWorkflowCategories } from "@repo/shared/workflow/featureFlags";
import { WorkflowCategoryId } from "../../catalog/schema/generated/schema";
import { buildWorkflowFeatureFlags } from "./gates";

describe("filterFlagGatedWorkflowCategories", () => {
  const GATED = buildWorkflowCategory(WorkflowCategoryId.ASSEMBLY);
  const UNGATED = buildWorkflowCategory(WorkflowCategoryId.VARIANT_CALLING);
  // The catalog types `category` as a plain string, so a value outside the enum
  // can reach the filter.
  const UNKNOWN = buildWorkflowCategory("NOT_A_CATEGORY");

  it("returns a gated category when its feature flag is enabled", () => {
    expect(
      filterFlagGatedWorkflowCategories(
        [GATED],
        buildWorkflowFeatureFlags({
          [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
        })
      )
    ).toEqual([GATED]);
  });

  it("filters out a gated category when its feature flag is disabled", () => {
    expect(
      filterFlagGatedWorkflowCategories([GATED], buildWorkflowFeatureFlags())
    ).toEqual([]);
  });

  it("returns categories named after an inherited object member", () => {
    // Nothing in the schema produces these, but the lookup must miss rather
    // than resolve `Object.prototype` and report the category as gated.
    const inherited = ["toString", "constructor", "__proto__"].map(
      buildWorkflowCategory
    );
    expect(
      filterFlagGatedWorkflowCategories(inherited, buildWorkflowFeatureFlags())
    ).toEqual(inherited);
  });

  it("returns categories that no feature flag gates, whatever the flag state", () => {
    expect(
      filterFlagGatedWorkflowCategories(
        [UNGATED, UNKNOWN],
        buildWorkflowFeatureFlags()
      )
    ).toEqual([UNGATED, UNKNOWN]);
  });

  it("filters only the gated categories, preserving order", () => {
    expect(
      filterFlagGatedWorkflowCategories(
        [UNGATED, GATED, UNKNOWN],
        buildWorkflowFeatureFlags()
      )
    ).toEqual([UNGATED, UNKNOWN]);
  });

  it("returns an empty list unchanged", () => {
    expect(
      filterFlagGatedWorkflowCategories(
        [],
        buildWorkflowFeatureFlags({
          [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
        })
      )
    ).toEqual([]);
  });
});

/**
 * Builds a workflow category with the given ID. Only `category` is read by the
 * filter, so the remaining fields are placeholders.
 * @param category - Workflow category ID.
 * @returns Workflow category.
 */
function buildWorkflowCategory(category: string): WorkflowCategory {
  return {
    category,
    description: "desc",
    name: category.toLowerCase(),
    showComingSoon: false,
    workflows: [],
  };
}
