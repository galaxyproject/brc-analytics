import {
  WORKFLOW_CATEGORY_ID,
  WORKFLOW_SCOPE,
} from "@repo/shared/apis/schema-types";
import {
  ASSEMBLY_CONFIGURE_SCOPES,
  ORGANISM_CONFIGURE_SCOPES,
} from "@repo/shared/components/workflow/WorkflowGate/constants";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { indexWorkflowsById } from "@repo/shared/services/workflows/loader";
import {
  getEntitiesById,
  getEntitiesByType,
  setEntitiesById,
} from "@repo/shared/services/workflows/store";
import { LOGAN_SEARCH } from "@repo/shared/workflow/loganSearch";
import { formatTrsId } from "@repo/shared/workflow/utils";
import { render, screen } from "@testing-library/react";
import {
  buildWorkflowCategory,
  HYPHY_TRS_ID,
  seedWorkflowsStore,
  UNGATED_TRS_ID,
} from "../workflow/gates";

const mockUseFeatureFlag = jest.fn<boolean, []>(() => false);

jest.mock(
  "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag",
  () => ({ useFeatureFlag: (): boolean => mockUseFeatureFlag() })
);

const ASSEMBLY_TRS_ID =
  "#workflow/github.com/iwc-workflows/polish-with-long-reads/main/versions/v0.1";
const ORGANISM_TRS_ID =
  "#workflow/github.com/iwc-workflows/assembly-with-flye/main/versions/v0.4";
const SHARED_TRS_ID =
  "#workflow/github.com/iwc-workflows/shared-across-categories/main";

/**
 * Renders the gate for the given URL TRS ID.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 * @param scopes - Workflow scopes the page accepts.
 */
function renderGate(
  trsId: string,
  scopes: readonly WORKFLOW_SCOPE[] = ASSEMBLY_CONFIGURE_SCOPES
): void {
  render(
    <WorkflowGate fallback={<div>not found</div>} scopes={scopes} trsId={trsId}>
      <div>content</div>
    </WorkflowGate>
  );
}

describe("WorkflowGate", () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockReturnValue(false);
    seedWorkflowsStore(
      [
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.OTHER, [
          UNGATED_TRS_ID,
          HYPHY_TRS_ID,
          SHARED_TRS_ID,
        ]),
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [
          ASSEMBLY_TRS_ID,
          SHARED_TRS_ID,
        ]),
        buildWorkflowCategory(
          WORKFLOW_CATEGORY_ID.GENOME_COMPARISONS,
          [ORGANISM_TRS_ID],
          WORKFLOW_SCOPE.ORGANISM
        ),
      ],
      [LOGAN_SEARCH]
    );
  });

  test("renders children for a known workflow", () => {
    renderGate(formatTrsId(UNGATED_TRS_ID));

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders the fallback for an unknown workflow", () => {
    renderGate("stale-workflow-id");

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the fallback for a workflow in a gated category", () => {
    renderGate(formatTrsId(ASSEMBLY_TRS_ID));

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children for a workflow also listed under an ungated category", () => {
    renderGate(formatTrsId(SHARED_TRS_ID));

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders the fallback for a workflow gated in its own right", () => {
    // The URL carries the formatted TRS ID; the rule must still match.
    renderGate(formatTrsId(HYPHY_TRS_ID));

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders the fallback for a gated workflow outside the catalog", () => {
    // Stored under its raw TRS ID with no category; must fall through to the
    // workflow-level rule rather than fail the category lookup.
    renderGate(LOGAN_SEARCH.trsId, [LOGAN_SEARCH.scope]);

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children for a workflow outside the catalog when the demo flag is on", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    renderGate(LOGAN_SEARCH.trsId, [LOGAN_SEARCH.scope]);

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders children for gated workflows when the demo flag is on", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    renderGate(formatTrsId(ASSEMBLY_TRS_ID));

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders the fallback for a workflow of a scope the page does not accept, even when the demo flag is on", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    // An assembly-scope workflow opened on an organism page.
    renderGate(formatTrsId(UNGATED_TRS_ID), ORGANISM_CONFIGURE_SCOPES);

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children for an organism-scope workflow on the assembly page", () => {
    // The assistant hands off every workflow to the assembly page.
    renderGate(formatTrsId(ORGANISM_TRS_ID), ASSEMBLY_CONFIGURE_SCOPES);

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders children for an organism-scope workflow on the organism page", () => {
    renderGate(formatTrsId(ORGANISM_TRS_ID), ORGANISM_CONFIGURE_SCOPES);

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("does not render a catalog workflow when its categories are not loaded", () => {
    // Only the by-id lookup is loaded; the category list is missing. The gate
    // must fail closed rather than read the workflow as in no category.
    getEntitiesById().clear();
    getEntitiesByType().clear();
    setEntitiesById(
      "workflows",
      indexWorkflowsById([
        buildWorkflowCategory(WORKFLOW_CATEGORY_ID.ASSEMBLY, [ASSEMBLY_TRS_ID]),
      ])
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => renderGate(formatTrsId(ASSEMBLY_TRS_ID))).toThrow();
    expect(screen.queryByText("content")).toBeNull();

    consoleError.mockRestore();
  });
});
