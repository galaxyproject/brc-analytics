import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import {
  getEntitiesById,
  setEntitiesById,
} from "@repo/shared/services/workflows/store";
import { render, screen } from "@testing-library/react";

describe("WorkflowGate", () => {
  beforeEach(() => {
    getEntitiesById().clear();
    const workflowsMap = new Map<string, unknown>();
    workflowsMap.set("workflow-id", { trsId: "workflow-id" });
    setEntitiesById("workflows", workflowsMap);
  });

  test("renders children for a known workflow", () => {
    render(
      <WorkflowGate fallback={<div>not found</div>} trsId="workflow-id">
        <div>content</div>
      </WorkflowGate>
    );

    expect(screen.getByText("content")).toBeTruthy();
    expect(screen.queryByText("not found")).toBeNull();
  });

  test("renders the fallback for an unknown workflow", () => {
    render(
      <WorkflowGate fallback={<div>not found</div>} trsId="stale-workflow-id">
        <div>content</div>
      </WorkflowGate>
    );

    expect(screen.getByText("not found")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });
});
