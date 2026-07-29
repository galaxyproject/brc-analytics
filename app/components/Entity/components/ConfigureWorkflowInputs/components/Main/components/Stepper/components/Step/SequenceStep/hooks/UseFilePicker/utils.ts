import { ParseResult } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseFilePicker/types";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_SEQUENCE_LENGTH,
  MIN_SEQUENCE_LENGTH,
  VALIDATION_ERROR,
} from "./constants";

/**
 * Reads a FASTA file and validates its content.
 * Validates that the file contains a single sequence between 50 and 5000 bases.
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
      const content = (reader.result as string).trim();

      if (!content) {
        resolve({ data: "", errors: [VALIDATION_ERROR.EMPTY_CONTENT] });
        return;
      }

      if (!content.startsWith(">")) {
        resolve({ data: "", errors: [VALIDATION_ERROR.INVALID_FASTA] });
        return;
      }

      const lines = content.split("\n");
      const headerCount = lines.filter((line) => line.startsWith(">")).length;

      if (headerCount > 1) {
        resolve({ data: "", errors: [VALIDATION_ERROR.MULTIPLE_SEQUENCES] });
        return;
      }

      const sequenceLength = lines
        .filter((line) => !line.startsWith(">"))
        .join("")
        .replace(/\s/g, "").length;

      if (sequenceLength < MIN_SEQUENCE_LENGTH) {
        resolve({ data: "", errors: [VALIDATION_ERROR.SEQUENCE_TOO_SHORT] });
        return;
      }

      if (sequenceLength > MAX_SEQUENCE_LENGTH) {
        resolve({ data: "", errors: [VALIDATION_ERROR.SEQUENCE_TOO_LONG] });
        return;
      }

      resolve({ data: content, errors: [] });
    };

    reader.onerror = (): void => {
      reject(new Error(VALIDATION_ERROR.PARSE_FAILED));
    };

    reader.readAsText(file);
  });
}
