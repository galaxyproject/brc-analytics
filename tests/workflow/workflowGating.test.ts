import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  bindWorkflowFeatureFlags,
  type WorkflowFeatureFlags,
} from "@repo/shared/workflow/featureFlags";
import { LMLS_WORKFLOWS } from "@repo/shared/workflow/lmls";
import { WorkflowCategoryId } from "../../catalog/schema/generated/schema";
import { buildWorkflowCategory, buildWorkflowGates } from "./gates";

const HYPHY_TRS_ID =
  "#workflow/github.com/iwc-workflows/hyphy/capheine-core-and-compare/versions/v0-1";
const UNGATED_TRS_ID = "#workflow/github.com/iwc-workflows/something/main";

describe("isWorkflowAllowed", () => {
  it("allows a workflow that no gate matches, whatever the flag state", () => {
    expect(
      buildWorkflowGates().isWorkflowAllowed({ trsId: UNGATED_TRS_ID })
    ).toBe(true);
  });

  it("gates the Hyphy workflow on its own flag", () => {
    expect(
      buildWorkflowGates().isWorkflowAllowed({ trsId: HYPHY_TRS_ID })
    ).toBe(false);
    expect(
      buildWorkflowGates({ [FEATURE_FLAGS.HYPHY]: true }).isWorkflowAllowed({
        trsId: HYPHY_TRS_ID,
      })
    ).toBe(true);
  });

  it("matches Hyphy by prefix, so a new version stays gated", () => {
    // The trailing segment is a version, so the rule cannot be an exact match.
    expect(
      buildWorkflowGates().isWorkflowAllowed({
        trsId: `${HYPHY_TRS_ID}-a-later-version`,
      })
    ).toBe(false);
  });

  it("gates every LMLS workflow on the LMLS flag", () => {
    const disabled = buildWorkflowGates();
    const enabled = buildWorkflowGates({ [FEATURE_FLAGS.LMLS]: true });
    for (const { trsId } of LMLS_WORKFLOWS) {
      expect(disabled.isWorkflowAllowed({ trsId })).toBe(false);
      expect(enabled.isWorkflowAllowed({ trsId })).toBe(true);
    }
  });

  it("does not let one gate's flag open another's workflow", () => {
    const hyphyOnly = buildWorkflowGates({ [FEATURE_FLAGS.HYPHY]: true });
    for (const { trsId } of LMLS_WORKFLOWS) {
      expect(hyphyOnly.isWorkflowAllowed({ trsId })).toBe(false);
    }
  });
});

describe("bindWorkflowFeatureFlags", () => {
  it("binds both levels to the same flag state", () => {
    const { filterCategories, isWorkflowAllowed } = buildWorkflowGates({
      [FEATURE_FLAGS.ASSEMBLY_WORKFLOWS]: true,
    });
    const category = buildWorkflowCategory(WorkflowCategoryId.ASSEMBLY, [
      UNGATED_TRS_ID,
    ]);
    expect(filterCategories([category])).toEqual([category]);
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
