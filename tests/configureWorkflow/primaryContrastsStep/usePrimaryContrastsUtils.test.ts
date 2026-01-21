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
  test("returns true when factorValuesCount is less than 2", () => {
    expect(isDisabled(CONTRAST_MODE.ALL_AGAINST_ALL, true, true, 0)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.ALL_AGAINST_ALL, true, true, 1)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.BASELINE, true, true, 1)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.EXPLICIT, true, true, 1)).toBe(true);
  });

  test("returns false for ALL_AGAINST_ALL mode with sufficient factor values", () => {
    expect(isDisabled(CONTRAST_MODE.ALL_AGAINST_ALL, false, false, 2)).toBe(
      false
    );
    expect(isDisabled(CONTRAST_MODE.ALL_AGAINST_ALL, true, true, 3)).toBe(
      false
    );
  });

  test("returns inverse of validation state for EXPLICIT mode", () => {
    expect(isDisabled(CONTRAST_MODE.EXPLICIT, false, false, 2)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.EXPLICIT, false, true, 2)).toBe(false);
  });

  test("returns inverse of validation state for BASELINE mode", () => {
    expect(isDisabled(CONTRAST_MODE.BASELINE, false, false, 2)).toBe(true);
    expect(isDisabled(CONTRAST_MODE.BASELINE, true, false, 2)).toBe(false);
  });
});
