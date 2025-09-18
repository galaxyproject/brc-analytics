import { ReadRun } from "../../../../types";

/**
 * Returns true if the row data is valid for selection.
 * Row is selectable if it is a single-end run or if it has a valid FTP URL for paired-end runs.
 * @param row - Original row data.
 * @returns True if the row data is valid.
 */
export function validationAccessorFn(row: ReadRun): boolean {
  const libraryLayout = row.library_layout;

  // Return true if the row is "SINGLE".
  if (libraryLayout === "SINGLE") return true;

  // Confirm for "PAIRED" that the row has a valid FTP URL.
  const fastqs = row.fastq_ftp;

  if (!fastqs) return false;
  if (typeof fastqs !== "string") return false;

  return fastqs.split(";").length >= 2;
}
