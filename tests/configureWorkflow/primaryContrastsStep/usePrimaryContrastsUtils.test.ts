import {
  getPrimaryContrasts,
  isDisabled,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UsePrimaryContrasts/utils";
import { CONTRAST_MODE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";

describe("getPrimaryContrasts", () => {
  test("returns ALL_AGAINST_ALL contrasts for ALL_AGAINST_ALL mode", () => {
    const result = getPrimaryContrasts(
      CONTRAST_MODE.ALL_AGAINST_ALL,
      null,
      null
    );

    expect(result).toEqual({ type: "ALL_AGAINST_ALL" });
  });

  test("returns explicit contrasts for EXPLICIT mode", () => {
    const explicitContrasts = {
      pairs: [
        ["control", "treated"],
        ["baseline", "experiment"],
      ] as [string, string][],
      type: "EXPLICIT" as const,
    };

    const result = getPrimaryContrasts(
      CONTRAST_MODE.EXPLICIT,
      null,
      explicitContrasts
    );

    expect(result).toEqual(explicitContrasts);
  });

  test("returns null for EXPLICIT mode with no explicit contrasts", () => {
    const result = getPrimaryContrasts(CONTRAST_MODE.EXPLICIT, null, null);

    expect(result).toBeNull();
  });

  test("returns baseline contrasts for BASELINE mode", () => {
    const baselineContrasts = {
      baseline: "control",
      compare: ["treated", "experimental"],
      type: "BASELINE" as const,
    };

    const result = getPrimaryContrasts(
      CONTRAST_MODE.BASELINE,
      baselineContrasts,
      null
    );

    expect(result).toEqual(baselineContrasts);
  });

  test("returns null for BASELINE mode with no baseline contrasts", () => {
    const result = getPrimaryContrasts(CONTRAST_MODE.BASELINE, null, null);

    expect(result).toBeNull();
  });
});

describe("isDisabled", () => {
  test("returns false for ALL_AGAINST_ALL mode regardless of validation", () => {
    expect(isDisabled(CONTRAST_MODE.ALL_AGAINST_ALL, false, false)).toBe(false);
    expect(isDisabled(CONTRAST_MODE.ALL_AGAINST_ALL, true, true)).toBe(false);
  });

  test("returns inverse of validation state for EXPLICIT mode", () => {
    expect(isDisabled(CONTRAST_MODE.EXPLICIT, false, false)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.EXPLICIT, false, true)).toBe(false);
  });

  test("returns inverse of validation state for BASELINE mode", () => {
    expect(isDisabled(CONTRAST_MODE.BASELINE, false, false)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.BASELINE, true, false)).toBe(false);
  });
});
