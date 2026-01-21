import { parseFile } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils";
import {
  MAX_FILE_SIZE_BYTES,
  VALIDATION_ERROR,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/constants";

/**
 * Creates a mock File object with the given content and name.
 * @param content - The file content.
 * @param name - The file name.
 * @returns The mock File object.
 */
function createMockFile(content: string, name: string): File {
  return new File([content], name, { type: "text/plain" });
}

/**
 * Creates a mock File with a specific size.
 * @param name - The file name.
 * @param sizeInBytes - The file size in bytes.
 * @returns The mock File object.
 */
function createMockFileWithSize(name: string, sizeInBytes: number): File {
  const content = new Array(sizeInBytes).fill("a").join("");
  return new File([content], name, { type: "text/plain" });
}

describe("parseFile", () => {
  describe("parsing", () => {
    test("parses CSV file with comma delimiter", async () => {
      const csvContent =
        "name,age,city,country\nAlice,30,Boston,USA\nBob,25,Seattle,USA";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.rows).toEqual([
        { age: "30", city: "Boston", country: "USA", name: "Alice" },
        { age: "25", city: "Seattle", country: "USA", name: "Bob" },
      ]);
      expect(result.errors).toEqual([]);
    });

    test("parses TSV file with tab delimiter", async () => {
      const tsvContent =
        "name\tage\tcity\tcountry\nAlice\t30\tBoston\tUSA\nBob\t25\tSeattle\tUSA";
      const file = createMockFile(tsvContent, "test.tsv");

      const result = await parseFile(file);

      expect(result.rows).toEqual([
        { age: "30", city: "Boston", country: "USA", name: "Alice" },
        { age: "25", city: "Seattle", country: "USA", name: "Bob" },
      ]);
      expect(result.errors).toEqual([]);
    });

    test("handles uppercase TSV extension", async () => {
      const tsvContent = "a\tb\tc\td\n1\t2\t3\t4\n5\t6\t7\t8";
      const file = createMockFile(tsvContent, "test.TSV");

      const result = await parseFile(file);

      expect(result.rows).toEqual([
        { a: "1", b: "2", c: "3", d: "4" },
        { a: "5", b: "6", c: "7", d: "8" },
      ]);
    });

    test("skips empty lines", async () => {
      const csvContent = "a,b,c,d\n1,2,3,4\n\n5,6,7,8\n";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.rows).toEqual([
        { a: "1", b: "2", c: "3", d: "4" },
        { a: "5", b: "6", c: "7", d: "8" },
      ]);
    });

    test("handles values with spaces", async () => {
      const csvContent =
        "name,location,country,notes\nAlice Smith,New York City,USA,test";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.rows).toEqual([
        {
          country: "USA",
          location: "New York City",
          name: "Alice Smith",
          notes: "test",
        },
      ]);
    });
  });

  describe("validation", () => {
    test("returns no errors for valid file", async () => {
      const csvContent = "a,b,c,d\n1,2,3,4\n5,6,7,8";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).toEqual([]);
    });

    test("returns error and empty rows when file size exceeds maximum", async () => {
      const file = createMockFileWithSize("large.csv", MAX_FILE_SIZE_BYTES + 1);

      const result = await parseFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.FILE_TOO_LARGE]);
      expect(result.rows).toEqual([]);
    });

    test("returns error when file has fewer than 4 columns", async () => {
      const csvContent = "a,b,c\n1,2,3\n4,5,6";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).toContain(VALIDATION_ERROR.INSUFFICIENT_COLUMNS);
    });

    test("returns error when file has fewer than 2 data rows", async () => {
      const csvContent = "a,b,c,d\n1,2,3,4";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).toContain(VALIDATION_ERROR.INSUFFICIENT_ROWS);
    });

    test("returns error when file has only headers (no data rows)", async () => {
      const csvContent = "a,b,c,d";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).toContain(VALIDATION_ERROR.INSUFFICIENT_ROWS);
    });

    test("returns multiple errors when multiple validations fail", async () => {
      const csvContent = "a,b\n1,2";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).toContain(VALIDATION_ERROR.INSUFFICIENT_COLUMNS);
      expect(result.errors).toContain(VALIDATION_ERROR.INSUFFICIENT_ROWS);
    });

    test("does not return column error when exactly 4 columns", async () => {
      const csvContent = "a,b,c,d\n1,2,3,4\n5,6,7,8";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).not.toContain(
        VALIDATION_ERROR.INSUFFICIENT_COLUMNS
      );
    });

    test("does not return row error when exactly 2 data rows", async () => {
      const csvContent = "a,b,c,d\n1,2,3,4\n5,6,7,8";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      expect(result.errors).not.toContain(VALIDATION_ERROR.INSUFFICIENT_ROWS);
    });

    test("filters out empty column headers from count", async () => {
      // File with empty headers should not count those columns
      const csvContent = "a,b,,\n1,2,3,4\n5,6,7,8";
      const file = createMockFile(csvContent, "test.csv");

      const result = await parseFile(file);

      // Only 2 valid columns (a, b), so should have insufficient columns error
      expect(result.errors).toContain(VALIDATION_ERROR.INSUFFICIENT_COLUMNS);
    });
  });
});
