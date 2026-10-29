import { WORKFLOW_PARAMETER_VARIABLE } from "@repo/shared/apis/schema-types";
import type { Workflow } from "@repo/shared/apis/workflow";
import {
  getRequiredAssemblyCount,
  workflowMeetsAssemblyMinimum,
  workflowReachesAssemblyMaximum,
  workflowRequiresFastaCollection,
} from "@repo/shared/workflow/utils";

describe("workflowMeetsAssemblyMinimum", () => {
  test("returns true when assemblyCountMin is 0 (no assembly requirement)", () => {
    expect(workflowMeetsAssemblyMinimum(0, 0)).toBe(true);
    expect(workflowMeetsAssemblyMinimum(0, 5)).toBe(true);
  });

  test("returns true when compatible count meets or exceeds minimum", () => {
    expect(workflowMeetsAssemblyMinimum(1, 1)).toBe(true);
    expect(workflowMeetsAssemblyMinimum(1, 5)).toBe(true);
    expect(workflowMeetsAssemblyMinimum(2, 2)).toBe(true);
    expect(workflowMeetsAssemblyMinimum(2, 5)).toBe(true);
  });

  test("returns false when compatible count is below minimum", () => {
    expect(workflowMeetsAssemblyMinimum(1, 0)).toBe(false);
    expect(workflowMeetsAssemblyMinimum(2, 1)).toBe(false);
    expect(workflowMeetsAssemblyMinimum(2, 0)).toBe(false);
  });
});

describe("workflowReachesAssemblyMaximum", () => {
  test("returns false when the workflow has no maximum", () => {
    expect(workflowReachesAssemblyMaximum(null, 0)).toBe(false);
    expect(workflowReachesAssemblyMaximum(null, 100)).toBe(false);
  });

  test("returns false when the selected count is below the maximum", () => {
    expect(workflowReachesAssemblyMaximum(3, 0)).toBe(false);
    expect(workflowReachesAssemblyMaximum(3, 2)).toBe(false);
  });

  test("returns true when the selected count reaches the maximum", () => {
    expect(workflowReachesAssemblyMaximum(3, 3)).toBe(true);
    expect(workflowReachesAssemblyMaximum(3, 4)).toBe(true);
  });
});

describe("workflowRequiresFastaCollection", () => {
  test("returns true when the workflow declares a FASTA collection parameter", () => {
    const workflow = {
      parameters: [
        {
          key: "Unaligned sequences",
          variable: WORKFLOW_PARAMETER_VARIABLE.FASTA_COLLECTION,
        },
      ],
    } as Workflow;
    expect(workflowRequiresFastaCollection(workflow)).toBe(true);
  });

  test("returns false when the workflow declares no FASTA collection parameter", () => {
    const workflow = {
      parameters: [
        {
          key: "Paired reads",
          variable: WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED,
        },
        { key: "Free text" },
      ],
    } as Workflow;
    expect(workflowRequiresFastaCollection(workflow)).toBe(false);
  });
});

describe("getRequiredAssemblyCount", () => {
  test("returns the workflow's minimum", () => {
    expect(getRequiredAssemblyCount({ assemblyCountMin: 2 })).toBe(2);
  });

  test("never returns fewer than one", () => {
    expect(getRequiredAssemblyCount({ assemblyCountMin: 0 })).toBe(1);
  });
});
