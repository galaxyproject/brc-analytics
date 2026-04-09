import { isValid } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/AccessionCountStep/hooks/UseAccessionCount/utils";

describe("isValid", () => {
  test("returns true for valid positive integer string", () => {
    expect(isValid("10")).toBe(true);
  });

  test("returns true for minimum value of 1", () => {
    expect(isValid("1")).toBe(true);
  });

  test("returns true for large numbers", () => {
    expect(isValid("1000")).toBe(true);
  });

  test("returns false for zero", () => {
    expect(isValid("0")).toBe(false);
  });

  test("returns false for negative numbers", () => {
    expect(isValid("-1")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValid("")).toBe(false);
  });

  test("returns false for decimal numbers", () => {
    expect(isValid("10.5")).toBe(false);
  });

  test("returns false for string with trailing characters", () => {
    expect(isValid("1abc")).toBe(false);
  });

  test("returns false for non-numeric string", () => {
    expect(isValid("abc")).toBe(false);
  });

  test("returns false for string with leading space", () => {
    expect(isValid(" 10")).toBe(false);
  });
});
