import { getUniqueFactorValues } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/utils";

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
