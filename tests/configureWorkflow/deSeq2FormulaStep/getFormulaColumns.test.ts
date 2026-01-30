import { getFormulaColumns } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/DESeq2FormulaStep/hooks/UseFormulaSelection/utils";
import { COLUMN_TYPE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

describe("getFormulaColumns", () => {
  test("returns empty array when sampleSheetClassification is undefined", () => {
    expect(getFormulaColumns(undefined)).toEqual([]);
  });

  test("returns empty array when sampleSheetClassification is empty", () => {
    expect(getFormulaColumns({})).toEqual([]);
  });

  test("filters out columns with null classification", () => {
    const sampleSheetClassification = {
      batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: null,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      columnName: "batch",
      columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
    });
  });

  test("filters out IDENTIFIER column type", () => {
    const sampleSheetClassification = {
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0].columnName).toBe("treatment");
  });

  test("filters out FORWARD_FILE_URL column type", () => {
    const sampleSheetClassification = {
      forward: COLUMN_TYPE.FORWARD_FILE_URL,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0].columnName).toBe("treatment");
  });

  test("filters out REVERSE_FILE_URL column type", () => {
    const sampleSheetClassification = {
      reverse: COLUMN_TYPE.REVERSE_FILE_URL,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0].columnName).toBe("treatment");
  });

  test("filters out QC_ONLY column type", () => {
    const sampleSheetClassification = {
      qc_metric: COLUMN_TYPE.QC_ONLY,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0].columnName).toBe("treatment");
  });

  test("filters out IGNORED column type", () => {
    const sampleSheetClassification = {
      notes: COLUMN_TYPE.IGNORED,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0].columnName).toBe("treatment");
  });

  test("includes BIOLOGICAL_FACTOR column type", () => {
    const sampleSheetClassification = {
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      columnName: "treatment",
      columnType: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    });
  });

  test("includes TECHNICAL_BLOCKING_FACTOR column type", () => {
    const sampleSheetClassification = {
      batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      columnName: "batch",
      columnType: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
    });
  });

  test("includes OTHER_COVARIATE column type", () => {
    const sampleSheetClassification = {
      age: COLUMN_TYPE.OTHER_COVARIATE,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      columnName: "age",
      columnType: COLUMN_TYPE.OTHER_COVARIATE,
    });
  });

  test("includes all formula-relevant column types together", () => {
    const sampleSheetClassification = {
      age: COLUMN_TYPE.OTHER_COVARIATE,
      batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(3);
    const columnNames = result.map((c) => c.columnName);
    expect(columnNames).toContain("treatment");
    expect(columnNames).toContain("batch");
    expect(columnNames).toContain("age");
  });

  test("filters mixed column types correctly", () => {
    const sampleSheetClassification = {
      age: COLUMN_TYPE.OTHER_COVARIATE,
      batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      forward: COLUMN_TYPE.FORWARD_FILE_URL,
      notes: COLUMN_TYPE.IGNORED,
      qc_metric: COLUMN_TYPE.QC_ONLY,
      reverse: COLUMN_TYPE.REVERSE_FILE_URL,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      unclassified: null,
    };

    const result = getFormulaColumns(sampleSheetClassification);

    expect(result).toHaveLength(3);
    const columnNames = result.map((c) => c.columnName);
    expect(columnNames).toContain("treatment");
    expect(columnNames).toContain("batch");
    expect(columnNames).toContain("age");
    expect(columnNames).not.toContain("sample_id");
    expect(columnNames).not.toContain("forward");
    expect(columnNames).not.toContain("reverse");
    expect(columnNames).not.toContain("qc_metric");
    expect(columnNames).not.toContain("notes");
    expect(columnNames).not.toContain("unclassified");
  });
});
