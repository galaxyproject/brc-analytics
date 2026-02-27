import {
  getColumnNames,
  validateClassifications,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/utils";
import {
  COLUMN_TYPE,
  ColumnClassifications,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

const EXPECTED = {
  BIOLOGICAL_FACTOR_REQUIRED:
    "At least one biological factor column is required",
  FORWARD_URL_REQUIRED: "One forward file URL column is required",
  IDENTIFIER_REQUIRED: "One identifier column is required",
  REVERSE_URL_REQUIRED: "One reverse file URL column is required",
} as const;

describe("validateClassifications", () => {
  test("returns valid when all requirements are met", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("returns valid with multiple biological factors", () => {
    const classifications: ColumnClassifications = {
      condition: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("returns valid with optional column types", () => {
    const classifications: ColumnClassifications = {
      batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      covariate: COLUMN_TYPE.OTHER_COVARIATE,
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      notes: COLUMN_TYPE.IGNORED,
      qc_metric: COLUMN_TYPE.QC_ONLY,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("returns error when columns are not classified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: null,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("1 column(s) are not classified");
  });

  test("returns error when multiple columns are not classified", () => {
    const classifications: ColumnClassifications = {
      forward_path: null,
      reverse_path: null,
      sample_id: null,
      treatment: null,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("4 column(s) are not classified");
  });

  test("returns error when no identifier is specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IGNORED,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(EXPECTED.IDENTIFIER_REQUIRED);
  });

  test("returns error when multiple identifiers are specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      other_id: COLUMN_TYPE.IDENTIFIER,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Only one identifier column is allowed");
  });

  test("returns error when no forward file URL is specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.IGNORED,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(EXPECTED.FORWARD_URL_REQUIRED);
  });

  test("returns error when multiple forward file URLs are specified", () => {
    const classifications: ColumnClassifications = {
      forward_path1: COLUMN_TYPE.FORWARD_FILE_URL,
      forward_path2: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Only one forward file URL column is allowed"
    );
  });

  test("returns error when no reverse file URL is specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.IGNORED,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(EXPECTED.REVERSE_URL_REQUIRED);
  });

  test("returns error when multiple reverse file URLs are specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path1: COLUMN_TYPE.REVERSE_FILE_URL,
      reverse_path2: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Only one reverse file URL column is allowed"
    );
  });

  test("returns error when no biological factor is specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_URL,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.IGNORED,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(EXPECTED.BIOLOGICAL_FACTOR_REQUIRED);
  });

  test("returns multiple errors when multiple requirements are not met", () => {
    const classifications: ColumnClassifications = {
      forward_path: null,
      reverse_path: null,
      sample_id: null,
      treatment: null,
    };

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
    expect(result.errors).toContain("4 column(s) are not classified");
    expect(result.errors).toContain(EXPECTED.IDENTIFIER_REQUIRED);
    expect(result.errors).toContain(EXPECTED.FORWARD_URL_REQUIRED);
    expect(result.errors).toContain(EXPECTED.REVERSE_URL_REQUIRED);
    expect(result.errors).toContain(EXPECTED.BIOLOGICAL_FACTOR_REQUIRED);
  });

  test("returns errors for empty classifications", () => {
    const classifications: ColumnClassifications = {};

    const result = validateClassifications(classifications);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(EXPECTED.IDENTIFIER_REQUIRED);
    expect(result.errors).toContain(EXPECTED.FORWARD_URL_REQUIRED);
    expect(result.errors).toContain(EXPECTED.REVERSE_URL_REQUIRED);
    expect(result.errors).toContain(EXPECTED.BIOLOGICAL_FACTOR_REQUIRED);
  });
});

describe("getColumnNames", () => {
  test("extracts column names from sample sheet", () => {
    const sampleSheet = [
      { age: "30", city: "Boston", name: "Alice" },
      { age: "25", city: "Seattle", name: "Bob" },
    ];

    const result = getColumnNames(sampleSheet);

    expect(result).toEqual(["age", "city", "name"]);
  });

  test("returns empty array for undefined sample sheet", () => {
    const result = getColumnNames(undefined);

    expect(result).toEqual([]);
  });

  test("returns empty array for empty sample sheet", () => {
    const result = getColumnNames([]);

    expect(result).toEqual([]);
  });

  test("extracts column names from single row", () => {
    const sampleSheet = [{ sample_id: "S1", treatment: "control" }];

    const result = getColumnNames(sampleSheet);

    expect(result).toEqual(["sample_id", "treatment"]);
  });
});
