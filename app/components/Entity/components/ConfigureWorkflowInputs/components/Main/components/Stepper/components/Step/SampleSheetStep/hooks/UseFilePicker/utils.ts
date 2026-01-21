import Papa from "papaparse";
import {
  MAX_FILE_SIZE_BYTES,
  MIN_COLUMNS,
  MIN_DATA_ROWS,
  VALIDATION_ERROR,
} from "./constants";

/**
 * Calculates unique non-empty column names from PapaParse meta.
 * Handles empty headers and renamed headers (when PapaParse renames duplicates).
 * @param fields - Array of field names from meta.fields.
 * @param renamedHeaders - Map of original to renamed headers from meta.renamedHeaders.
 * @returns Set of unique non-empty column names.
 */
export function getColumnNames(
  fields?: string[],
  renamedHeaders?: Record<string, string>
): Set<string> {
  // Start with non-empty fields.
  const columnNames = new Set((fields ?? []).filter((field) => !!field));

  // Process renamed headers: remove original key, add renamed value if non-empty.
  for (const [key, value] of Object.entries(renamedHeaders ?? {})) {
    columnNames.delete(key);
    if (value) {
      columnNames.add(value);
    }
  }

  return columnNames;
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
 * Checks if a file has changed by comparing metadata.
 * @param prevFile - The previous file.
 * @param newFile - The new file.
 * @returns True if the file has changed, false otherwise.
 */
export function hasFileChanged(prevFile: File | null, newFile: File): boolean {
  if (!prevFile) return true;

  return (
    prevFile.name !== newFile.name ||
    prevFile.size !== newFile.size ||
    prevFile.lastModified !== newFile.lastModified
  );
}

/**
 * Checks if the file picker state is valid.
 * @param file - The selected file.
 * @param errors - The validation errors.
 * @returns True if a file is selected and there are no errors.
 */
export function isValid(file: File | null, errors: string[]): boolean {
  return file !== null && errors.length === 0;
}

/**
 * Parses and validates a CSV or TSV file.
 * @param file - The file to parse.
 * @returns Promise resolving to parsed rows and validation errors.
 */
export function parseFile(
  file: File
): Promise<{ errors: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const errors: string[] = [];

    // Validate file size.
    if (file.size > MAX_FILE_SIZE_BYTES) {
      resolve({
        errors: [VALIDATION_ERROR.FILE_TOO_LARGE],
        rows: [],
      });
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      complete: ({ data: rows, meta }) => {
        const columnNames = getColumnNames(meta.fields, meta.renamedHeaders);

        // Validate column count.
        if (columnNames.size < MIN_COLUMNS) {
          errors.push(VALIDATION_ERROR.INSUFFICIENT_COLUMNS);
        }

        // Validate row count.
        if (rows.length < MIN_DATA_ROWS) {
          errors.push(VALIDATION_ERROR.INSUFFICIENT_ROWS);
        }

        resolve({ errors, rows });
      },
      delimiter: getDelimiter(file.name),
      error: (error) => {
        reject(error);
      },
      header: true,
      skipEmptyLines: true,
    });
  });
}
