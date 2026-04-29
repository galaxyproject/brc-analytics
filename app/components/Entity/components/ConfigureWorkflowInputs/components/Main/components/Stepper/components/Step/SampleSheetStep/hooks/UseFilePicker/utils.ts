import Papa from "papaparse";
import { ParseResult } from "../../../hooks/UseFilePicker/types";
import {
  MAX_FILE_SIZE_BYTES,
  MIN_COLUMNS,
  MIN_DATA_ROWS,
  VALIDATION_ERROR,
} from "./constants";

/**
 * Extracts unique column names from the provided fields.
 * @param fields - The array of field names.
 * @returns A set of unique column names.
 */
export function getColumnNames(fields?: string[]): Set<string> {
  return new Set(fields ?? []);
}

/**
 * Returns the delimiter based on file extension.
 * @param fileName - The name of the file.
 * @returns The delimiter character.
 */
function getDelimiter(fileName: string): string {
  return fileName.toLowerCase().endsWith(".tsv") ? "\t" : ",";
}

/**
 * Parses and validates a CSV or TSV file.
 * @param file - The file to parse.
 * @returns Promise resolving to parsed rows and validation errors.
 */
export function parseFile(
  file: File
): Promise<ParseResult<Record<string, string>[]>> {
  return new Promise((resolve, reject) => {
    const errors: string[] = [];

    // Validate file size.
    if (file.size > MAX_FILE_SIZE_BYTES) {
      resolve({
        data: [],
        errors: [VALIDATION_ERROR.FILE_TOO_LARGE],
      });
      return;
    }

    // Normalize line endings (CRLF and lone CR → LF) so parsing is consistent
    // across OSes — uploads from Windows/Excel otherwise leave trailing \r in
    // the last cell of each row.
    const reader = new FileReader();
    reader.onerror = (): void => reject(reader.error);
    reader.onload = (): void => {
      const normalized = (reader.result as string).replace(/\r\n?/g, "\n");
      Papa.parse<Record<string, string>>(normalized, {
        complete: ({ data: rows, meta }) => {
          const columnNames = getColumnNames(meta.fields);

          // Check for empty headers.
          if (columnNames.has("")) {
            resolve({
              data: [],
              errors: [VALIDATION_ERROR.EMPTY_HEADERS],
            });
            return;
          }

          // Check for duplicate headers.
          if (meta.renamedHeaders) {
            resolve({
              data: [],
              errors: [VALIDATION_ERROR.DUPLICATE_HEADERS],
            });
            return;
          }

          // Validate column count.
          if (columnNames.size < MIN_COLUMNS) {
            errors.push(VALIDATION_ERROR.INSUFFICIENT_COLUMNS);
          }

          // Validate row count.
          if (rows.length < MIN_DATA_ROWS) {
            errors.push(VALIDATION_ERROR.INSUFFICIENT_ROWS);
          }

          resolve({ data: rows, errors });
        },
        delimiter: getDelimiter(file.name),
        error: (error: Error) => {
          reject(error);
        },
        header: true,
        skipEmptyLines: true,
      });
    };
    reader.readAsText(file);
  });
}
