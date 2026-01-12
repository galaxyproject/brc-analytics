import { parseFile } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/utils";

/**
 * Creates a mock File object with the given content and name.
 * @param content - The file content.
 * @param name - The file name.
 * @returns The mock File object.
 */
function createMockFile(content: string, name: string): File {
  return new File([content], name, { type: "text/plain" });
}

describe("parseFile", () => {
  test("parses CSV file with comma delimiter", async () => {
    const csvContent = "name,age,city\nAlice,30,Boston\nBob,25,Seattle";
    const file = createMockFile(csvContent, "test.csv");

    const result = await parseFile(file);

    expect(result.rows).toEqual([
      { age: "30", city: "Boston", name: "Alice" },
      { age: "25", city: "Seattle", name: "Bob" },
    ]);
  });

  test("parses TSV file with tab delimiter", async () => {
    const tsvContent = "name\tage\tcity\nAlice\t30\tBoston\nBob\t25\tSeattle";
    const file = createMockFile(tsvContent, "test.tsv");

    const result = await parseFile(file);

    expect(result.rows).toEqual([
      { age: "30", city: "Boston", name: "Alice" },
      { age: "25", city: "Seattle", name: "Bob" },
    ]);
  });

  test("handles uppercase TSV extension", async () => {
    const tsvContent = "name\tage\nAlice\t30";
    const file = createMockFile(tsvContent, "test.TSV");

    const result = await parseFile(file);

    expect(result.rows).toEqual([{ age: "30", name: "Alice" }]);
  });

  test("skips empty lines", async () => {
    const csvContent = "name,age\nAlice,30\n\nBob,25\n";
    const file = createMockFile(csvContent, "test.csv");

    const result = await parseFile(file);

    expect(result.rows).toEqual([
      { age: "30", name: "Alice" },
      { age: "25", name: "Bob" },
    ]);
  });

  test("returns empty array for file with only headers", async () => {
    const csvContent = "name,age,city";
    const file = createMockFile(csvContent, "test.csv");

    const result = await parseFile(file);

    expect(result.rows).toEqual([]);
  });

  test("handles single row", async () => {
    const csvContent = "name,age\nAlice,30";
    const file = createMockFile(csvContent, "test.csv");

    const result = await parseFile(file);

    expect(result.rows).toEqual([{ age: "30", name: "Alice" }]);
  });

  test("handles values with spaces", async () => {
    const csvContent = "name,location\nAlice Smith,New York City";
    const file = createMockFile(csvContent, "test.csv");

    const result = await parseFile(file);

    expect(result.rows).toEqual([
      { location: "New York City", name: "Alice Smith" },
    ]);
  });
});
