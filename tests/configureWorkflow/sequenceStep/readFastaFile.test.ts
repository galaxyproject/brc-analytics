import {
  MAX_FILE_SIZE_BYTES,
  VALIDATION_ERROR,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequenceStep/hooks/UseFilePicker/constants";
import { readFastaFile } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequenceStep/hooks/UseFilePicker/utils";

/**
 * Creates a mock File with the given content and name.
 * @param content - The file content.
 * @param name - The file name.
 * @returns The mock File object.
 */
function createMockFile(content: string, name = "test.fasta"): File {
  return new File([content], name, { type: "text/plain" });
}

/**
 * Creates a mock File with a specific size.
 * @param sizeInBytes - The file size in bytes.
 * @returns The mock File object.
 */
function createMockFileWithSize(sizeInBytes: number): File {
  const content = new Array(sizeInBytes).fill("a").join("");
  return new File([content], "large.fasta", { type: "text/plain" });
}

describe("readFastaFile", () => {
  describe("valid files", () => {
    test("parses a valid single-sequence FASTA file", async () => {
      const content = ">seq1\nATGCGTACGTAGCTAGC";
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });

    test("parses a valid multi-sequence FASTA file", async () => {
      const content = ">seq1\nATGCGTACG\n>seq2\nTAGCTAGCT";
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });

    test("trims leading and trailing whitespace", async () => {
      const content = "  >seq1\nATGCGTACG  ";
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(">seq1\nATGCGTACG");
    });

    test("handles FASTA with description in header line", async () => {
      const content = ">seq1 some description\nATGCGTACG";
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });
  });

  describe("validation errors", () => {
    test("returns error when file size exceeds maximum", async () => {
      const file = createMockFileWithSize(MAX_FILE_SIZE_BYTES + 1);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.FILE_TOO_LARGE]);
      expect(result.data).toBe("");
    });

    test("returns error when file is empty", async () => {
      const file = createMockFile("");

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.EMPTY_CONTENT]);
      expect(result.data).toBe("");
    });

    test("returns error when file contains only whitespace", async () => {
      const file = createMockFile("   \n\n  ");

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.EMPTY_CONTENT]);
      expect(result.data).toBe("");
    });

    test("returns error when file does not start with >", async () => {
      const file = createMockFile("ATGCGTACG");

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.INVALID_FASTA]);
      expect(result.data).toBe("");
    });

    test("returns error when file starts with sequence data instead of header", async () => {
      const file = createMockFile("seq1\nATGCGTACG");

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.INVALID_FASTA]);
      expect(result.data).toBe("");
    });
  });

  describe("edge cases", () => {
    test("accepts file at exactly the size limit", async () => {
      // Create a valid FASTA that's exactly at the limit.
      const header = ">seq1\n";
      const sequence = new Array(MAX_FILE_SIZE_BYTES - header.length)
        .fill("A")
        .join("");
      const file = createMockFile(header + sequence);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toContain(">seq1");
    });

    test("accepts file with only a header line", async () => {
      const file = createMockFile(">seq1");

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(">seq1");
    });
  });
});
