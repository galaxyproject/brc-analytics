import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  bindWorkflowFeatureFlags,
  isWorkflowEnabled,
  type WorkflowFeatureFlags,
} from "@repo/shared/workflow/featureFlags";
import { LEXICMAP } from "@repo/shared/workflow/lexicmap";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";
import { WorkflowCategoryId } from "../../catalog/schema/generated/schema";
import { buildWorkflowFeatureFlags, buildWorkflowGates } from "./gates";

const HYPHY_TRS_ID =
  "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/v0-1";
const UNGATED_TRS_ID = "#workflow/github.com/iwc-workflows/something/main";

describe("isWorkflowEnabled", () => {
  it("returns a workflow that no gate matches, whatever the flag state", () => {
    expect(
      isWorkflowEnabled({ trsId: UNGATED_TRS_ID }, buildWorkflowFeatureFlags())
    ).toBe(true);
  });

  it("gates the Hyphy workflow on its own flag", () => {
    expect(
      isWorkflowEnabled({ trsId: HYPHY_TRS_ID }, buildWorkflowFeatureFlags())
    ).toBe(false);
    expect(
      isWorkflowEnabled(
        { trsId: HYPHY_TRS_ID },
        buildWorkflowFeatureFlags({ [FEATURE_FLAGS.HYPHY]: true })
      )
    ).toBe(true);
  });

  it("matches Hyphy by prefix, so a new version stays gated", () => {
    // The trailing segment is a version, so the rule cannot be an exact match.
    expect(
      isWorkflowEnabled(
        { trsId: `${HYPHY_TRS_ID}-a-later-version` },
        buildWorkflowFeatureFlags()
      )
    ).toBe(false);
  });

  it("gates both LMLS workflows on the LMLS flag", () => {
    const disabled = buildWorkflowFeatureFlags();
    const enabled = buildWorkflowFeatureFlags({ [FEATURE_FLAGS.LMLS]: true });
    for (const { trsId } of [LOGAN_SEARCH, LEXICMAP]) {
      expect(isWorkflowEnabled({ trsId }, disabled)).toBe(false);
      expect(isWorkflowEnabled({ trsId }, enabled)).toBe(true);
    }
  });

  it("does not let one gate's flag open another's workflow", () => {
    const hyphyOnly = buildWorkflowFeatureFlags({
      [FEATURE_FLAGS.HYPHY]: true,
    });
    expect(isWorkflowEnabled({ trsId: LEXICMAP.trsId }, hyphyOnly)).toBe(false);
  });
});

describe("bindWorkflowFeatureFlags", () => {
  it("binds both levels to the same flag state", () => {
    const { filterCategories, isWorkflowAllowed } = buildWorkflowGates({
      [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
    });
    const assembly = {
      category: WorkflowCategoryId.ASSEMBLY,
      description: "desc",
      name: "assembly",
      showComingSoon: false,
      workflows: [],
    };
    expect(filterCategories([assembly])).toEqual([assembly]);
    // The category is open; the workflow's own gate is not.
    expect(isWorkflowAllowed({ trsId: HYPHY_TRS_ID })).toBe(false);
  });
});

describe("WorkflowFeatureFlags exhaustiveness", () => {
  it("rejects a flag state that leaves a gate unanswered", () => {
    // The guarantee the gating design rests on: every resolver must answer
    // every gate, so adding one can't leave gated content visible by default.
    // If this stops erroring, the record has been loosened and a new gate could
    // ship unanswered — which is why the assertion is inverted here.
    // @ts-expect-error -- an incomplete flag state must not type-check.
    const incomplete: WorkflowFeatureFlags = {
      [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
    };
    expect(bindWorkflowFeatureFlags(incomplete)).toBeDefined();
  });
});
