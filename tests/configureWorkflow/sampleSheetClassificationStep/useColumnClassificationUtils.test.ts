import {
  initClassifications,
  updateClassification,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/hooks/UseColumnClassification/utils";
import { COLUMN_TYPE } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

describe("initClassifications", () => {
  test("creates map with all columns set to null", () => {
    const columnNames = ["col1", "col2", "col3"];

    const result = initClassifications(columnNames);

    expect(result.size).toBe(3);
    expect(result.get("col1")).toBeNull();
    expect(result.get("col2")).toBeNull();
    expect(result.get("col3")).toBeNull();
  });

  test("returns empty map for empty column names array", () => {
    const result = initClassifications([]);

    expect(result.size).toBe(0);
  });

  test("creates map with single column", () => {
    const columnNames = ["sample_id"];

    const result = initClassifications(columnNames);

    expect(result.size).toBe(1);
    expect(result.get("sample_id")).toBeNull();
  });

  test("preserves column name order in map iteration", () => {
    const columnNames = ["zebra", "alpha", "middle"];

    const result = initClassifications(columnNames);
    const keys = Array.from(result.keys());

    expect(keys).toEqual(["zebra", "alpha", "middle"]);
  });

  test("handles column names with special characters", () => {
    const columnNames = ["col-1", "col_2", "col.3", "col 4"];

    const result = initClassifications(columnNames);

    expect(result.size).toBe(4);
    expect(result.has("col-1")).toBe(true);
    expect(result.has("col_2")).toBe(true);
    expect(result.has("col.3")).toBe(true);
    expect(result.has("col 4")).toBe(true);
  });
});

describe("updateClassification", () => {
  test("updates classification for existing column", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([
      ["col1", null],
      ["col2", null],
    ]);

    const updater = updateClassification("col1", COLUMN_TYPE.IDENTIFIER);
    const result = updater(initial);

    expect(result.get("col1")).toBe(COLUMN_TYPE.IDENTIFIER);
    expect(result.get("col2")).toBeNull();
  });

  test("returns a new map instance (immutable update)", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([["col1", null]]);

    const updater = updateClassification("col1", COLUMN_TYPE.IDENTIFIER);
    const result = updater(initial);

    expect(result).not.toBe(initial);
    expect(initial.get("col1")).toBeNull(); // Original unchanged
    expect(result.get("col1")).toBe(COLUMN_TYPE.IDENTIFIER);
  });

  test("can change existing classification to different type", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([
      ["col1", COLUMN_TYPE.IDENTIFIER],
    ]);

    const updater = updateClassification("col1", COLUMN_TYPE.IGNORED);
    const result = updater(initial);

    expect(result.get("col1")).toBe(COLUMN_TYPE.IGNORED);
  });

  test("can set classification to null", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([
      ["col1", COLUMN_TYPE.IDENTIFIER],
    ]);

    const updater = updateClassification("col1", null);
    const result = updater(initial);

    expect(result.get("col1")).toBeNull();
  });

  test("preserves other column classifications", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([
      ["col1", COLUMN_TYPE.IDENTIFIER],
      ["col2", COLUMN_TYPE.FORWARD_FILE_URL],
      ["col3", COLUMN_TYPE.BIOLOGICAL_FACTOR],
    ]);

    const updater = updateClassification("col2", COLUMN_TYPE.REVERSE_FILE_URL);
    const result = updater(initial);

    expect(result.get("col1")).toBe(COLUMN_TYPE.IDENTIFIER);
    expect(result.get("col2")).toBe(COLUMN_TYPE.REVERSE_FILE_URL);
    expect(result.get("col3")).toBe(COLUMN_TYPE.BIOLOGICAL_FACTOR);
  });

  test("adds new column if it does not exist", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([["col1", null]]);

    const updater = updateClassification("col2", COLUMN_TYPE.IDENTIFIER);
    const result = updater(initial);

    expect(result.size).toBe(2);
    expect(result.get("col2")).toBe(COLUMN_TYPE.IDENTIFIER);
  });

  test("works with all column types", () => {
    const initial = new Map<string, COLUMN_TYPE | null>([["col1", null]]);

    const allTypes = [
      COLUMN_TYPE.IDENTIFIER,
      COLUMN_TYPE.FORWARD_FILE_URL,
      COLUMN_TYPE.REVERSE_FILE_URL,
      COLUMN_TYPE.BIOLOGICAL_FACTOR,
      COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
      COLUMN_TYPE.OTHER_COVARIATE,
      COLUMN_TYPE.QC_ONLY,
      COLUMN_TYPE.IGNORED,
    ];

    allTypes.forEach((type) => {
      const updater = updateClassification("col1", type);
      const result = updater(initial);
      expect(result.get("col1")).toBe(type);
    });
  });

  test("returns curried function that can be called multiple times", () => {
    const updater = updateClassification("col1", COLUMN_TYPE.IDENTIFIER);

    const map1 = new Map<string, COLUMN_TYPE | null>([["col1", null]]);
    const map2 = new Map<string, COLUMN_TYPE | null>([
      ["col1", COLUMN_TYPE.IGNORED],
    ]);

    const result1 = updater(map1);
    const result2 = updater(map2);

    expect(result1.get("col1")).toBe(COLUMN_TYPE.IDENTIFIER);
    expect(result2.get("col1")).toBe(COLUMN_TYPE.IDENTIFIER);
  });
});
