import { isEligible } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/query/utils";

describe("isEligible", () => {
  test("returns false when count is undefined (still loading)", () => {
    expect(isEligible(undefined, 60000)).toBe(false);
  });

  test("returns false when count is 0 (no read runs to browse)", () => {
    expect(isEligible(0, 60000)).toBe(false);
  });

  test("returns false for a negative count", () => {
    expect(isEligible(-1, 60000)).toBe(false);
  });

  test("returns false for a NaN count", () => {
    expect(isEligible(NaN, 60000)).toBe(false);
  });

  test("returns true when count is between 1 and the cap", () => {
    expect(isEligible(123, 60000)).toBe(true);
  });

  test("returns false when count equals the cap (strictly less than)", () => {
    expect(isEligible(60000, 60000)).toBe(false);
  });

  test("returns false when count exceeds the cap", () => {
    expect(isEligible(67705, 60000)).toBe(false);
  });
});
