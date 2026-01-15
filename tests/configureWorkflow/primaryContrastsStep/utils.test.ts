import { getUniqueFactorValues } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/utils";
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

describe("getUniqueFactorValues", () => {
  test("extracts unique values from primary factor column", () => {
    const configuredInput = {
      primaryFactor: "condition",
      sampleSheet: [
        { condition: "control", sample_id: "S1" },
        { condition: "treated", sample_id: "S2" },
        { condition: "control", sample_id: "S3" },
        { condition: "treated", sample_id: "S4" },
      ],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual(["control", "treated"]);
  });

  test("returns sorted unique values", () => {
    const configuredInput = {
      primaryFactor: "treatment",
      sampleSheet: [
        { sample_id: "S1", treatment: "zinc" },
        { sample_id: "S2", treatment: "alpha" },
        { sample_id: "S3", treatment: "beta" },
        { sample_id: "S4", treatment: "alpha" },
      ],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual(["alpha", "beta", "zinc"]);
  });

  test("returns empty array when sampleSheet is undefined", () => {
    const configuredInput = {
      primaryFactor: "condition",
      sampleSheet: undefined,
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual([]);
  });

  test("returns empty array when sampleSheet is empty", () => {
    const configuredInput = {
      primaryFactor: "condition",
      sampleSheet: [],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual([]);
  });

  test("returns empty array when primaryFactor is null", () => {
    const configuredInput = {
      primaryFactor: null,
      sampleSheet: [{ condition: "control", sample_id: "S1" }],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual([]);
  });

  test("returns empty array when primaryFactor is undefined", () => {
    const configuredInput = {
      primaryFactor: undefined,
      sampleSheet: [{ condition: "control", sample_id: "S1" }],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual([]);
  });

  test("skips rows with empty values for primary factor", () => {
    const configuredInput = {
      primaryFactor: "condition",
      sampleSheet: [
        { condition: "control", sample_id: "S1" },
        { condition: "", sample_id: "S2" },
        { condition: "treated", sample_id: "S3" },
      ],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual(["control", "treated"]);
  });

  test("handles rows missing the primary factor column", () => {
    const configuredInput = {
      primaryFactor: "condition",
      sampleSheet: [
        { condition: "control", sample_id: "S1" },
        { sample_id: "S2" } as Record<string, string>,
        { condition: "treated", sample_id: "S3" },
      ],
    };

    const result = getUniqueFactorValues(configuredInput);

    expect(result).toEqual(["control", "treated"]);
  });
});
