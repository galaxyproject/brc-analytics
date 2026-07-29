import {
  MAX_FILE_SIZE_BYTES,
  MAX_SEQUENCE_LENGTH,
  MIN_SEQUENCE_LENGTH,
  VALIDATION_ERROR,
} from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequenceStep/hooks/UseFilePicker/constants";
import { readFastaFile } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequenceStep/hooks/UseFilePicker/utils";

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
 * Creates a string of nucleotide characters of the given length.
 * @param length - The number of bases.
 * @returns A string of repeated 'A' characters.
 */
function makeSequence(length: number): string {
  return new Array(length).fill("A").join("");
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
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });

    test("parses a valid multi-line single-sequence FASTA file", async () => {
      const seq1 = makeSequence(30);
      const seq2 = makeSequence(30);
      const content = `>seq1\n${seq1}\n${seq2}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });

    test("trims leading and trailing whitespace", async () => {
      const content = `  >seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}  `;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(`>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`);
    });

    test("handles FASTA with description in header line", async () => {
      const content = `>seq1 some description\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });

    test("accepts file with exactly 50 bases (lower boundary)", async () => {
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(content);
    });

    test("accepts file with exactly 5000 bases (upper boundary)", async () => {
      const content = `>seq1\n${makeSequence(MAX_SEQUENCE_LENGTH)}`;
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

    test("returns error when file contains multiple sequences", async () => {
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}\n>seq2\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.MULTIPLE_SEQUENCES]);
      expect(result.data).toBe("");
    });

    test("returns error when sequence is shorter than 50 bases", async () => {
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH - 1)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.SEQUENCE_TOO_SHORT]);
      expect(result.data).toBe("");
    });

    test("returns error when sequence is longer than 5000 bases", async () => {
      const content = `>seq1\n${makeSequence(MAX_SEQUENCE_LENGTH + 1)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.SEQUENCE_TOO_LONG]);
      expect(result.data).toBe("");
    });
  });

  describe("edge cases", () => {
    test("does not return file too large error at exactly the size limit", async () => {
      // A file at exactly the size limit passes the file size check,
      // but the sequence exceeds the 5000-base limit.
      const header = ">seq1\n";
      const sequence = new Array(MAX_FILE_SIZE_BYTES - header.length)
        .fill("A")
        .join("");
      const file = createMockFile(header + sequence);

      const result = await readFastaFile(file);

      expect(result.errors).not.toContain(VALIDATION_ERROR.FILE_TOO_LARGE);
      expect(result.errors).toEqual([VALIDATION_ERROR.SEQUENCE_TOO_LONG]);
    });

    test("returns error when file has only a header line (0 bases)", async () => {
      const file = createMockFile(">seq1");

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.SEQUENCE_TOO_SHORT]);
      expect(result.data).toBe("");
    });
  });
});
