import { mapValidation } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationValidation/utils";
import { VALIDATION_LABELS } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationValidation/constants";
import {
  COLUMN_TYPE,
  ColumnClassifications,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

describe("mapValidation", () => {
  test("returns all validations as true when all requirements are met", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = mapValidation(classifications);

    expect(result).toEqual([
      [true, VALIDATION_LABELS.IDENTIFIER],
      [true, VALIDATION_LABELS.FORWARD_FILE_PATH],
      [true, VALIDATION_LABELS.REVERSE_FILE_PATH],
      [true, VALIDATION_LABELS.BIOLOGICAL_FACTOR],
      [true, "All columns classified"],
    ]);
  });

  test("returns identifier validation as false when no identifier specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IGNORED,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = mapValidation(classifications);

    expect(result[0]).toEqual([false, VALIDATION_LABELS.IDENTIFIER]);
  });

  test("returns forward file path validation as false when not specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.IGNORED,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = mapValidation(classifications);

    expect(result[1]).toEqual([false, VALIDATION_LABELS.FORWARD_FILE_PATH]);
  });

  test("returns reverse file path validation as false when not specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      reverse_path: COLUMN_TYPE.IGNORED,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = mapValidation(classifications);

    expect(result[2]).toEqual([false, VALIDATION_LABELS.REVERSE_FILE_PATH]);
  });

  test("returns biological factor validation as false when not specified", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.IGNORED,
    };

    const result = mapValidation(classifications);

    expect(result[3]).toEqual([false, VALIDATION_LABELS.BIOLOGICAL_FACTOR]);
  });

  test("returns all columns classified as false when null values present", () => {
    const classifications: ColumnClassifications = {
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: null,
    };

    const result = mapValidation(classifications);

    expect(result[4]).toEqual([false, "All columns classified"]);
  });

  test("returns multiple validations as false when multiple requirements not met", () => {
    const classifications: ColumnClassifications = {
      forward_path: null,
      reverse_path: null,
      sample_id: null,
      treatment: null,
    };

    const result = mapValidation(classifications);

    expect(result).toEqual([
      [false, VALIDATION_LABELS.IDENTIFIER],
      [false, VALIDATION_LABELS.FORWARD_FILE_PATH],
      [false, VALIDATION_LABELS.REVERSE_FILE_PATH],
      [false, VALIDATION_LABELS.BIOLOGICAL_FACTOR],
      [false, "All columns classified"],
    ]);
  });

  test("handles empty classifications object", () => {
    const classifications: ColumnClassifications = {};

    const result = mapValidation(classifications);

    expect(result).toEqual([
      [false, VALIDATION_LABELS.IDENTIFIER],
      [false, VALIDATION_LABELS.FORWARD_FILE_PATH],
      [false, VALIDATION_LABELS.REVERSE_FILE_PATH],
      [false, VALIDATION_LABELS.BIOLOGICAL_FACTOR],
      [true, "All columns classified"],
    ]);
  });

  test("returns correct validation with multiple biological factors", () => {
    const classifications: ColumnClassifications = {
      condition: COLUMN_TYPE.BIOLOGICAL_FACTOR,
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = mapValidation(classifications);

    expect(result[3]).toEqual([true, VALIDATION_LABELS.BIOLOGICAL_FACTOR]);
  });

  test("returns correct validation with optional column types", () => {
    const classifications: ColumnClassifications = {
      batch: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      covariate: COLUMN_TYPE.OTHER_COVARIATE,
      forward_path: COLUMN_TYPE.FORWARD_FILE_PATH,
      notes: COLUMN_TYPE.IGNORED,
      qc_metric: COLUMN_TYPE.QC_ONLY,
      reverse_path: COLUMN_TYPE.REVERSE_FILE_PATH,
      sample_id: COLUMN_TYPE.IDENTIFIER,
      treatment: COLUMN_TYPE.BIOLOGICAL_FACTOR,
    };

    const result = mapValidation(classifications);

    expect(result).toEqual([
      [true, VALIDATION_LABELS.IDENTIFIER],
      [true, VALIDATION_LABELS.FORWARD_FILE_PATH],
      [true, VALIDATION_LABELS.REVERSE_FILE_PATH],
      [true, VALIDATION_LABELS.BIOLOGICAL_FACTOR],
      [true, "All columns classified"],
    ]);
  });
});
