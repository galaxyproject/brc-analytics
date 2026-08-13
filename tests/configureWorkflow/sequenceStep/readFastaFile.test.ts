import {
  MAX_FILE_SIZE_BYTES,
  MAX_SEQUENCE_LENGTH,
  MIN_SEQUENCE_LENGTH,
  VALIDATION_ERROR,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequenceStep/hooks/UseFilePicker/constants";
import {
  readFastaFile,
  validateFastaContent,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequenceStep/hooks/UseFilePicker/utils";

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

describe("validateFastaContent", () => {
  describe("valid content", () => {
    test("accepts a valid single-sequence FASTA", () => {
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      expect(validateFastaContent(content)).toEqual([]);
    });

    test("accepts a multi-line single-sequence FASTA", () => {
      const content = `>seq1\n${makeSequence(30)}\n${makeSequence(30)}`;
      expect(validateFastaContent(content)).toEqual([]);
    });

    test("accepts a header with description", () => {
      const content = `>seq1 some description\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      expect(validateFastaContent(content)).toEqual([]);
    });

    test("handles CRLF line endings", () => {
      const content = `>seq1\r\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      expect(validateFastaContent(content)).toEqual([]);
    });
  });

  describe("invalid content", () => {
    test("returns error for empty content", () => {
      expect(validateFastaContent("")).toEqual([
        VALIDATION_ERROR.EMPTY_CONTENT,
      ]);
    });

    test("returns error when content does not start with >", () => {
      expect(validateFastaContent("ATGCGTACG")).toEqual([
        VALIDATION_ERROR.INVALID_FASTA,
      ]);
    });

    test("returns error when content starts with sequence data", () => {
      expect(validateFastaContent("seq1\nATGCGTACG")).toEqual([
        VALIDATION_ERROR.INVALID_FASTA,
      ]);
    });

    test("returns error for multiple sequences", () => {
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}\n>seq2\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      expect(validateFastaContent(content)).toEqual([
        VALIDATION_ERROR.MULTIPLE_SEQUENCES,
      ]);
    });

    test("returns error for header-only content (0 bases)", () => {
      expect(validateFastaContent(">seq1")).toEqual([
        VALIDATION_ERROR.SEQUENCE_TOO_SHORT,
      ]);
    });
  });

  describe("sequence length boundaries", () => {
    test.each([
      [0, [VALIDATION_ERROR.SEQUENCE_TOO_SHORT]],
      [MIN_SEQUENCE_LENGTH - 1, [VALIDATION_ERROR.SEQUENCE_TOO_SHORT]],
      [MIN_SEQUENCE_LENGTH, []],
      [MAX_SEQUENCE_LENGTH, []],
      [MAX_SEQUENCE_LENGTH + 1, [VALIDATION_ERROR.SEQUENCE_TOO_LONG]],
    ])("returns correct errors for %i bases", (length, expectedErrors) => {
      const content = `>seq1\n${makeSequence(length)}`;
      expect(validateFastaContent(content)).toEqual(expectedErrors);
    });
  });
});

describe("readFastaFile", () => {
  describe("file I/O", () => {
    test("parses a valid FASTA file", async () => {
      const content = `>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
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

    test("normalizes CRLF line endings to LF", async () => {
      const content = `>seq1\r\n${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(`>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`);
    });

    test("normalizes CR-only line endings to LF", async () => {
      const content = `>seq1\r${makeSequence(MIN_SEQUENCE_LENGTH)}`;
      const file = createMockFile(content);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([]);
      expect(result.data).toBe(`>seq1\n${makeSequence(MIN_SEQUENCE_LENGTH)}`);
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

    test("returns error when file size exceeds maximum", async () => {
      const file = createMockFileWithSize(MAX_FILE_SIZE_BYTES + 1);

      const result = await readFastaFile(file);

      expect(result.errors).toEqual([VALIDATION_ERROR.FILE_TOO_LARGE]);
      expect(result.data).toBe("");
    });

    test("does not return file too large error at exactly the size limit", async () => {
      // A file at exactly the size limit passes the file size check,
      // but the sequence exceeds the max length.
      const header = ">seq1\n";
      const sequence = new Array(MAX_FILE_SIZE_BYTES - header.length)
        .fill("A")
        .join("");
      const file = createMockFile(header + sequence);

      const result = await readFastaFile(file);

      expect(result.errors).not.toContain(VALIDATION_ERROR.FILE_TOO_LARGE);
      expect(result.errors).toEqual([VALIDATION_ERROR.SEQUENCE_TOO_LONG]);
    });
  });
});
