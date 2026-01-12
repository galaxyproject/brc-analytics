import Papa from "papaparse";

/**
 * Returns the delimiter based on file extension.
 * @param fileName - The name of the file.
 * @returns The delimiter character.
 */
function getDelimiter(fileName: string): string {
  return fileName.toLowerCase().endsWith(".tsv") ? "\t" : ",";
}

/**
 * Parses a CSV or TSV file into row data using PapaParse.
 * @param file - The file to parse.
 * @returns Promise resolving to the parsed sample sheet data.
 */
export function parseFile(
  file: File
): Promise<{ rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      complete: ({ data }) => {
        resolve({ rows: data });
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
