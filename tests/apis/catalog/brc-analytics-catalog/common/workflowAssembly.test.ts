import { workflowMeetsAssemblyMinimum } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/workflowAssembly";

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
