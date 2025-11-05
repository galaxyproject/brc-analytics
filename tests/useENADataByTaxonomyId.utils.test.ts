import { isEligible } from "../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByTaxonomyId/utils";

describe("isEligible", () => {
  test("returns false when taxonomyId is empty", () => {
    expect(isEligible("")).toBe(false);
  });

  test("returns false when taxonomyId is not found in counts", () => {
    expect(isEligible("__missing__")).toBe(false);
  });

  test("returns false when read count is 0 (not browsable)", () => {
    expect(isEligible("2767082")).toBe(false); // Known zero-count example from the dataset.
  });

  test("returns true when read count is below default maxReadRuns (2000)", () => {
    expect(isEligible("299321")).toBe(true); // Known small count (e.g., 21).
  });

  test("returns false when read count >= provided maxReadRuns (strictly less)", () => {
    expect(isEligible("299321", 21)).toBe(false);
    expect(isEligible("5833", 3000)).toBe(false);
  });
});
