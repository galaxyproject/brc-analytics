import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import {
  DIFFERENTIAL_EXPRESSION_ANALYSIS,
  DIFFERENTIAL_EXPRESSION_ANALYSIS_CATEGORY,
} from "@repo/shared/workflow/differentialExpressionAnalysis";
import {
  LMLS_WORKFLOW_CATEGORY,
  LMLS_WORKFLOWS,
} from "@repo/shared/workflow/lmls";
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
      expect(
        gates.filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, [UNGATED])
      ).toEqual([UNGATED]);
    }
  });

  it("gates the Hyphy workflow on the demo flag", () => {
    expect(
      buildWorkflowGates().filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, [HYPHY])
    ).toEqual([]);
    expect(
      buildWorkflowGates(true).filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, [
        HYPHY,
      ])
    ).toEqual([HYPHY]);
  });

  it("matches Hyphy by prefix, so a new version stays gated", () => {
    // The trailing segment is a version, so the rule cannot be an exact match.
    expect(
      buildWorkflowGates().filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, [
        buildWorkflow(`${HYPHY_TRS_ID}-a-later-version`),
      ])
    ).toEqual([]);
  });

  it("gates workflows through their category, whatever their own rules say", () => {
    expect(
      buildWorkflowGates().filterWorkflows(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
        UNGATED,
      ])
    ).toEqual([]);
    expect(
      buildWorkflowGates(true).filterWorkflows(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
        UNGATED,
      ])
    ).toEqual([UNGATED]);
  });

  it("gates every LMLS workflow on the demo flag, under the LMLS category", () => {
    expect(
      buildWorkflowGates().filterWorkflows(
        LMLS_WORKFLOW_CATEGORY,
        LMLS_WORKFLOWS
      )
    ).toEqual([]);
    expect(
      buildWorkflowGates(true).filterWorkflows(
        LMLS_WORKFLOW_CATEGORY,
        LMLS_WORKFLOWS
      )
    ).toEqual(LMLS_WORKFLOWS);
  });

  it("keeps Differential Expression Analysis under its category", () => {
    expect(
      buildWorkflowGates().filterWorkflows(
        DIFFERENTIAL_EXPRESSION_ANALYSIS_CATEGORY,
        [DIFFERENTIAL_EXPRESSION_ANALYSIS]
      )
    ).toEqual([DIFFERENTIAL_EXPRESSION_ANALYSIS]);
  });
});

describe("bindWorkflowGates", () => {
  it("closes every gate when the demo flag is off and opens them all when it is on", () => {
    // The single-flag guarantee, asserted in both directions: the off half
    // pins that each named gate is actually shut, the on half that the one
    // flag opens all of them — at both gating levels together.
    const gatedWorkflows = [HYPHY, ...LMLS_WORKFLOWS];
    const gatedCategory = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
      UNGATED,
      ...gatedWorkflows,
    ]);

    const disabled = buildWorkflowGates();
    expect(
      disabled.filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, gatedWorkflows)
    ).toEqual([]);
    expect(disabled.filterCategories([gatedCategory])).toEqual([]);

    const enabled = buildWorkflowGates(true);
    expect(
      enabled.filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, gatedWorkflows)
    ).toEqual(gatedWorkflows);
    expect(enabled.filterCategories([gatedCategory])).toEqual([gatedCategory]);
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
      expect(
        gates.filterWorkflows(WORKFLOW_CATEGORY_ID.OTHER, workflows)
      ).not.toBe(workflows);
    }
  });
});

describe("filterCategories and filterWorkflows", () => {
  it("agree on every category in a mixed catalog, whatever the flag state", () => {
    // A workflow listed under a category outside the catalog must be gated
    // exactly as that category's own workflows are.
    const catalog = [
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
        UNGATED_TRS_ID,
        HYPHY_TRS_ID,
      ]),
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
        UNGATED_TRS_ID,
        HYPHY_TRS_ID,
      ]),
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.VARIANT_CALLING, [
        UNGATED_TRS_ID,
      ]),
    ];

    for (const gates of [buildWorkflowGates(), buildWorkflowGates(true)]) {
      const listed = gates.filterCategories(catalog);
      for (const { category, workflows } of catalog) {
        const listedCategory = listed.find((c) => c.category === category);
        expect(gates.filterWorkflows(category, workflows)).toEqual(
          listedCategory?.workflows ?? []
        );
      }
    }
  });
});
