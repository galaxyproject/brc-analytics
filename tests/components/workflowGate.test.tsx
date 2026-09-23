import { WORKFLOW_CATEGORY_ID } from "@repo/shared/apis/schema-types";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
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
const SHARED_TRS_ID =
  "#workflow/github.com/iwc-workflows/shared-across-categories/main";

/**
 * Renders the gate for the given URL TRS ID.
 * @param trsId - Workflow TRS ID, as it appears in the URL.
 */
function renderGate(trsId: string): void {
  render(
    <WorkflowGate fallback={<div>not found</div>} trsId={trsId}>
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
    renderGate(LOGAN_SEARCH.trsId);

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  test("renders children for a workflow outside the catalog when the demo flag is on", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    renderGate(LOGAN_SEARCH.trsId);

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders children for gated workflows when the demo flag is on", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    renderGate(formatTrsId(ASSEMBLY_TRS_ID));

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });
});
