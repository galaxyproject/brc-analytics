import { isValid } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/AccessionCountStep/hooks/UseAccessionCount/utils";

describe("isValid", () => {
  test("returns true for valid positive integer", () => {
    expect(isValid(10)).toBe(true);
  });

  test("returns true for minimum value of 1", () => {
    expect(isValid(1)).toBe(true);
  });

  test("returns true for large numbers", () => {
    expect(isValid(1000)).toBe(true);
  });

  test("returns false for zero", () => {
    expect(isValid(0)).toBe(false);
  });

  test("returns false for negative numbers", () => {
    expect(isValid(-1)).toBe(false);
  });

  test("returns false for NaN", () => {
    expect(isValid(NaN)).toBe(false);
  });
});
