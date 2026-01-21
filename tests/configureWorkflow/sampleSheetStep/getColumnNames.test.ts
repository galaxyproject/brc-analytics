import { getColumnNames } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils";

describe("getColumnNames", () => {
  test("returns empty set when fields is undefined", () => {
    const result = getColumnNames(undefined);

    expect(result.size).toBe(0);
  });

  test("returns empty set when fields is empty array", () => {
    const result = getColumnNames([]);

    expect(result.size).toBe(0);
  });

  test("returns set with all field names", () => {
    const fields = ["name", "age", "city"];

    const result = getColumnNames(fields);

    expect(result).toEqual(new Set(["name", "age", "city"]));
  });

  test("includes empty string fields", () => {
    const fields = ["name", "", "age"];

    const result = getColumnNames(fields);

    expect(result).toEqual(new Set(["name", "", "age"]));
  });

  test("deduplicates field names", () => {
    const fields = ["name", "age", "name", "city"];

    const result = getColumnNames(fields);

    expect(result).toEqual(new Set(["name", "age", "city"]));
  });
});
