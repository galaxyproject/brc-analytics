import { type ParseResult } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseFilePicker/types";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_SEQUENCE_LENGTH,
  MIN_SEQUENCE_LENGTH,
  VALIDATION_ERROR,
} from "./constants";

/**
 * Validates FASTA content and returns validation errors.
 * Checks that the content is a valid FASTA with a single sequence
 * between the configured minimum and maximum base lengths.
 * @param content - The trimmed file content.
 * @returns Array of validation errors (empty if valid).
 */
export function validateFastaContent(content: string): string[] {
  if (!content) {
    return [VALIDATION_ERROR.EMPTY_CONTENT];
  }

  if (!content.startsWith(">")) {
    return [VALIDATION_ERROR.INVALID_FASTA];
  }

  const lines = content.split("\n");
  const headerCount = lines.filter((line) => line.startsWith(">")).length;

  if (headerCount > 1) {
    return [VALIDATION_ERROR.MULTIPLE_SEQUENCES];
  }

  const sequenceLength = lines
    .filter((line) => !line.startsWith(">"))
    .join("")
    .replace(/\s/g, "").length;

  if (sequenceLength < MIN_SEQUENCE_LENGTH) {
    return [VALIDATION_ERROR.SEQUENCE_TOO_SHORT];
  }

  if (sequenceLength > MAX_SEQUENCE_LENGTH) {
    return [VALIDATION_ERROR.SEQUENCE_TOO_LONG];
  }

  return [];
}

/**
 * Reads a FASTA file and validates its content.
 * Validates that the file contains a single sequence within the configured
 * minimum and maximum base lengths.
 * @param file - The file to read.
 * @returns Promise resolving to the sequence string and validation errors.
 */
export function readFastaFile(file: File): Promise<ParseResult<string>> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      resolve({ data: "", errors: [VALIDATION_ERROR.FILE_TOO_LARGE] });
      return;
    }

    const reader = new FileReader();

    reader.onload = (): void => {
      const normalized = (reader.result as string).replace(/\r\n?/g, "\n");
      const content = normalized.trim();
      const errors = validateFastaContent(content);
      resolve({ data: errors.length === 0 ? content : "", errors });
    };

    reader.onerror = (): void => {
      reject(new Error(VALIDATION_ERROR.PARSE_FAILED));
    };

    reader.readAsText(file);
  });
}
