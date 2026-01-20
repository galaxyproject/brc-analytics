import { getColumnNames } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils";

describe("getColumnNames", () => {
  test("returns empty set when fields is undefined", () => {
    const result = getColumnNames(undefined, undefined);

    expect(result.size).toBe(0);
  });

  test("returns empty set when fields is empty array", () => {
    const result = getColumnNames([], {});

    expect(result.size).toBe(0);
  });

  test("returns set with all non-empty field names", () => {
    const fields = ["name", "age", "city"];

    const result = getColumnNames(fields);

    expect(result).toEqual(new Set(["name", "age", "city"]));
  });

  test("filters out empty string fields", () => {
    const fields = ["name", "", "age", "", "city"];

    const result = getColumnNames(fields);

    expect(result).toEqual(new Set(["name", "age", "city"]));
  });

  test("handles renamed headers by removing original key", () => {
    const fields = ["name", "age", "age_1"];
    const renamedHeaders = { age_1: "age_2" };

    const result = getColumnNames(fields, renamedHeaders);

    expect(result.has("age_1")).toBe(false);
    expect(result.has("age_2")).toBe(true);
    expect(result).toEqual(new Set(["name", "age", "age_2"]));
  });

  test("removes empty renamed header values", () => {
    const fields = ["name", "age", ""];
    const renamedHeaders = { "": "" };

    const result = getColumnNames(fields, renamedHeaders);

    expect(result).toEqual(new Set(["name", "age"]));
  });

  test("handles multiple renamed headers", () => {
    const fields = ["a", "b", "b_1", "b_2"];
    const renamedHeaders = { b_1: "b_duplicate_1", b_2: "b_duplicate_2" };

    const result = getColumnNames(fields, renamedHeaders);

    expect(result).toEqual(
      new Set(["a", "b", "b_duplicate_1", "b_duplicate_2"])
    );
  });

  test("handles renamed header that maps to empty string", () => {
    const fields = ["name", "empty_col"];
    const renamedHeaders = { empty_col: "" };

    const result = getColumnNames(fields, renamedHeaders);

    expect(result).toEqual(new Set(["name"]));
    expect(result.has("empty_col")).toBe(false);
  });

  test("handles multiple empty columns renamed by PapaParse", () => {
    // PapaParse renames duplicate empty columns to _1, _2, etc.
    const fields = ["name", "", "_1", "_2"];
    const renamedHeaders = { _1: "", _2: "" };

    const result = getColumnNames(fields, renamedHeaders);

    expect(result).toEqual(new Set(["name"]));
  });

  test("preserves unique column names when no renaming needed", () => {
    const fields = ["sample_id", "forward_url", "reverse_url", "treatment"];

    const result = getColumnNames(fields, {});

    expect(result.size).toBe(4);
    expect(result).toEqual(
      new Set(["sample_id", "forward_url", "reverse_url", "treatment"])
    );
  });
});
