import { BaseReadRun, ReadRun, Validation } from "../../../../types";

/**
 * Returns validation object for the read run (includes error message and validation status).
 * Row is selectable with the following conditions:
 * - FASTQ data is present.
 * - Library layout is "SINGLE" or "PAIRED".
 * - Library layout "SINGLE" has exactly 1 FASTQ file.
 * - Library layout "PAIRED" has exactly 2 FASTQ files.
 * @param readRun - Read run.
 * @returns Validation object.
 */
function buildValidation(readRun: BaseReadRun): Validation {
  const { fastq_ftp: fastqs, library_layout: libraryLayout } = readRun;

  if (!fastqs)
    return {
      error: "FASTQ data is missing or invalid.",
      isValid: false,
    };

  const fastqCount = fastqs.split(";").length;

  switch (libraryLayout) {
    case "SINGLE":
      return validateFastq(libraryLayout, 1, fastqCount);
    case "PAIRED":
      return validateFastq(libraryLayout, 2, fastqCount);
    default: {
      return {
        error: `Invalid library layout: "${libraryLayout}".`,
        isValid: false,
      };
    }
  }
}

/**
 * Maps read runs to read run with validation.
 * @param readRuns - Read runs.
 * @returns Read run with validation.
 */
export function mapReadRuns(readRuns?: BaseReadRun[]): ReadRun[] {
  return (
    readRuns?.map((readRun) => ({
      ...readRun,
      validation: buildValidation(readRun),
    })) || []
  );
}

/**
 * Sanitizes read runs by ensuring that the fastq_ftp is a string.
 * @param readRuns - Read runs.
 * @returns Sanitized read runs.
 */
export function sanitizeReadRuns(readRuns: ReadRun[]): ReadRun[] {
  return (
    readRuns?.map((readRun) => ({
      ...readRun,
      fastq_ftp: typeof readRun.fastq_ftp === "string" ? readRun.fastq_ftp : "",
    })) || []
  );
}

/**
 * Returns a validation result for a specific library layout and the corresponding number of FASTQ files.
 * @param libraryLayout - The library layout type.
 * @param expected - Expected number of FASTQ files.
 * @param actual - Actual number of FASTQ files found.
 * @returns Validation result.
 */
function validateFastq(
  libraryLayout: string,
  expected: number,
  actual: number
): Validation {
  const isValid = actual === expected;
  const errorMessage = `"${libraryLayout}" run must have exactly ${expected} FASTQ ${expected === 1 ? "file" : "files"}, found ${actual}.`;
  return {
    error: isValid ? undefined : errorMessage,
    isValid,
  };
}
