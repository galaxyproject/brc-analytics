import workflowCategories from "@catalog/output/workflows.json";
import type { Workflow } from "@repo/shared/apis/workflow";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { UNCATALOGED_WORKFLOWS } from "@repo/shared/workflow/listedWorkflows";
import { indexWorkflowsById } from "@repo/shared/workflow/utils";

describe("catalog workflow ids", () => {
  test("finds no colliding ids across the catalog and the workflows outside it", () => {
    expect(() =>
      indexWorkflowsById<Pick<Workflow, "trsId">>(workflowCategories, [
        CUSTOM_WORKFLOW,
        ...UNCATALOGED_WORKFLOWS,
      ])
    ).not.toThrow();
  });
});
