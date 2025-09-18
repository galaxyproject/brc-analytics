import { ReadRun } from "../../../../types";

/**
 * Returns true if the row data is valid for selection.
 * Row is selectable if it is a single-end run (or other unknown layout values) or if it has two FTP URLs for paired-end runs.
 * @param row - Original row data.
 * @returns True if the row data is valid.
 */
export function validationAccessorFn(row: ReadRun): boolean {
  const libraryLayout = row.library_layout;

  if (libraryLayout === "PAIRED") {
    const fastqs = row.fastq_ftp;
    if (!fastqs) return false;
    if (typeof fastqs !== "string") return false;
    return fastqs.split(";").length === 2;
  }

  // For all other cases, return true.
  return true;
}
