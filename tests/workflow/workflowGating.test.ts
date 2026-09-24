import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import { nonCatalogWorkflow } from "@repo/shared/workflow/gates";
import { LMLS_WORKFLOWS } from "@repo/shared/workflow/lmls";
import {
  buildWorkflowCategory,
  buildWorkflowGates,
  HYPHY_TRS_ID,
  UNGATED_TRS_ID,
} from "./gates";

describe("isWorkflowAllowed", () => {
  it("allows a workflow that no gate matches, whatever the flag state", () => {
    expect(
      buildWorkflowGates().isWorkflowAllowed(nonCatalogWorkflow(UNGATED_TRS_ID))
    ).toBe(true);
  });

  it("gates the Hyphy workflow on the demo flag", () => {
    expect(
      buildWorkflowGates().isWorkflowAllowed(nonCatalogWorkflow(HYPHY_TRS_ID))
    ).toBe(false);
    expect(
      buildWorkflowGates(true).isWorkflowAllowed(
        nonCatalogWorkflow(HYPHY_TRS_ID)
      )
    ).toBe(true);
  });

  it("matches Hyphy by prefix, so a new version stays gated", () => {
    // The trailing segment is a version, so the rule cannot be an exact match.
    expect(
      buildWorkflowGates().isWorkflowAllowed(
        nonCatalogWorkflow(`${HYPHY_TRS_ID}-a-later-version`)
      )
    ).toBe(false);
  });

  it("gates a workflow through its category, whatever its own rules say", () => {
    const workflow = {
      categoryIds: [WORKFLOW_CATEGORY_ID.ASSEMBLY],
      trsId: UNGATED_TRS_ID,
    };
    expect(buildWorkflowGates().isWorkflowAllowed(workflow)).toBe(false);
    expect(buildWorkflowGates(true).isWorkflowAllowed(workflow)).toBe(true);
  });

  it("allows a workflow in an ungated category, and one in no category at all", () => {
    const disabled = buildWorkflowGates();
    expect(
      disabled.isWorkflowAllowed({
        categoryIds: [WORKFLOW_CATEGORY_ID.OTHER],
        trsId: UNGATED_TRS_ID,
      })
    ).toBe(true);
    expect(disabled.isWorkflowAllowed(nonCatalogWorkflow(UNGATED_TRS_ID))).toBe(
      true
    );
  });

  it("keeps a workflow listed under a gated and an ungated category, as the listings do", () => {
    // filterCategories still shows it under the ungated category, so the
    // configure path must agree rather than depend on catalog ordering.
    expect(
      buildWorkflowGates().isWorkflowAllowed({
        categoryIds: [
          WORKFLOW_CATEGORY_ID.ASSEMBLY,
          WORKFLOW_CATEGORY_ID.OTHER,
        ],
        trsId: UNGATED_TRS_ID,
      })
    ).toBe(true);
  });

  it("still gates a workflow by its own rule inside an ungated category", () => {
    expect(
      buildWorkflowGates().isWorkflowAllowed({
        categoryIds: [WORKFLOW_CATEGORY_ID.OTHER],
        trsId: HYPHY_TRS_ID,
      })
    ).toBe(false);
  });

  it("gates every LMLS workflow on the demo flag", () => {
    const disabled = buildWorkflowGates();
    const enabled = buildWorkflowGates(true);
    for (const { trsId } of LMLS_WORKFLOWS) {
      expect(disabled.isWorkflowAllowed(nonCatalogWorkflow(trsId))).toBe(false);
      expect(enabled.isWorkflowAllowed(nonCatalogWorkflow(trsId))).toBe(true);
    }
  });
});

describe("bindWorkflowGates", () => {
  it("closes every gate when the demo flag is off and opens them all when it is on", () => {
    // The single-flag guarantee, asserted in both directions: the off half
    // pins that each named gate is actually shut, the on half that the one
    // flag opens all of them — at both gating levels together.
    const gatedTrsIds = [
      HYPHY_TRS_ID,
      ...LMLS_WORKFLOWS.map(({ trsId }) => trsId),
    ];
    const gatedCategory = buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
      UNGATED_TRS_ID,
      ...gatedTrsIds,
    ]);

    const disabled = buildWorkflowGates();
    for (const trsId of gatedTrsIds) {
      expect(disabled.isWorkflowAllowed(nonCatalogWorkflow(trsId))).toBe(false);
    }
    expect(disabled.filterCategories([gatedCategory])).toEqual([]);

    const enabled = buildWorkflowGates(true);
    for (const trsId of gatedTrsIds) {
      expect(enabled.isWorkflowAllowed(nonCatalogWorkflow(trsId))).toBe(true);
    }
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
    for (const gates of [buildWorkflowGates(), buildWorkflowGates(true)]) {
      expect(gates.filterCategories(categories)).not.toBe(categories);
    }
  });
});

describe("filterCategories and isWorkflowAllowed", () => {
  it("agree on every workflow in a mixed catalog, whatever the flag state", () => {
    // The listing and the configure path must never disagree about whether a
    // workflow is shown.
    const SHARED_TRS_ID =
      "#workflow/github.com/iwc-workflows/shared-across-categories/main";
    const catalog = [
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
        UNGATED_TRS_ID,
        SHARED_TRS_ID,
        HYPHY_TRS_ID,
      ]),
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
        SHARED_TRS_ID,
        HYPHY_TRS_ID,
      ]),
      buildWorkflowCategory(WORKFLOW_CATEGORY_ID.VARIANT_CALLING, [
        UNGATED_TRS_ID,
      ]),
    ];
    const trsIds = new Set(
      catalog.flatMap(({ workflows }) => workflows.map(({ trsId }) => trsId))
    );

    for (const gates of [buildWorkflowGates(), buildWorkflowGates(true)]) {
      const listed = gates.filterCategories(catalog);
      for (const trsId of trsIds) {
        const categoryIds = catalog
          .filter(({ workflows }) => workflows.some((w) => w.trsId === trsId))
          .map(({ category }) => category);
        const isListed = listed.some(({ workflows }) =>
          workflows.some((w) => w.trsId === trsId)
        );
        expect(gates.isWorkflowAllowed({ categoryIds, trsId })).toBe(isListed);
      }
    }
  });
});
