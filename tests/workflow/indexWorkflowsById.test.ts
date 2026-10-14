import { indexWorkflowsById } from "@repo/shared/workflow/utils";

describe("indexWorkflowsById", () => {
  const TRS_ID_V0_1 =
    "#workflow/github.com/iwc-workflows/example/versions/v0.1";
  const TRS_ID_V0_1_HYPHENATED =
    "#workflow/github.com/iwc-workflows/example/versions/v0-1";
  const TRS_ID_V0_2 =
    "#workflow/github.com/iwc-workflows/example/versions/v0.2";

  test("indexes catalog and extra workflows under their URL-formatted TRS ID", () => {
    const catalogWorkflow = { trsId: TRS_ID_V0_1 };
    const extraWorkflow = { trsId: TRS_ID_V0_2 };

    const workflowById = indexWorkflowsById(
      [{ workflows: [catalogWorkflow] }],
      [extraWorkflow]
    );

    expect([...workflowById]).toEqual([
      [
        "workflow-github-com-iwc-workflows-example-versions-v0-1",
        catalogWorkflow,
      ],
      [
        "workflow-github-com-iwc-workflows-example-versions-v0-2",
        extraWorkflow,
      ],
    ]);
  });

  test("indexes a workflow listed more than once under its last listing", () => {
    const last = { trsId: TRS_ID_V0_1 };

    const workflowById = indexWorkflowsById([
      { workflows: [{ trsId: TRS_ID_V0_1 }] },
      { workflows: [last] },
    ]);

    expect(workflowById.size).toBe(1);
    expect(
      workflowById.get(
        "workflow-github-com-iwc-workflows-example-versions-v0-1"
      )
    ).toBe(last);
  });

  test("throws when different TRS IDs format to the same id", () => {
    expect(() =>
      indexWorkflowsById([
        { workflows: [{ trsId: TRS_ID_V0_1 }] },
        { workflows: [{ trsId: TRS_ID_V0_1_HYPHENATED }] },
      ])
    ).toThrow(
      `Workflows "${TRS_ID_V0_1}" and "${TRS_ID_V0_1_HYPHENATED}" share the URL id "workflow-github-com-iwc-workflows-example-versions-v0-1"`
    );
  });

  test("returns an empty map for no workflows", () => {
    expect(indexWorkflowsById([]).size).toBe(0);
  });
});
