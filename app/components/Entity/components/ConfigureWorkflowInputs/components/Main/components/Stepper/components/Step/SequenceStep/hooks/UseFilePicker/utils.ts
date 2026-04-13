import { ParseResult } from "../../../hooks/UseFilePicker/types";
import { MAX_FILE_SIZE_BYTES, VALIDATION_ERROR } from "./constants";

/**
 * Reads a FASTA file and validates its content.
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

      resolve({ data: content, errors: [] });
    };

    reader.onerror = (): void => {
      reject(new Error(VALIDATION_ERROR.PARSE_FAILED));
    };

    reader.readAsText(file);
  });
}
