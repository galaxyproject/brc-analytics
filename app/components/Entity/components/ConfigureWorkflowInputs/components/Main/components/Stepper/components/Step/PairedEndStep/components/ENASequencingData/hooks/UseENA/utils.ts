import { ENA_ACCESSION_REGEX_PATTERN } from "./constants";

/**
 * Determine the appropriate accession type based on the accession ID format.
 * Types are experiment, run, sample, and study.
 * @param accession - ENA accession number.
 * @returns Accession type.
 */
export function getAccessionType(
  accession: FormDataEntryValue | null
): string | null {
  if (typeof accession !== "string") return null;
  for (const [type, pattern] of Object.entries(ENA_ACCESSION_REGEX_PATTERN)) {
    if (pattern.test(accession)) {
      return type;
    }
  }
  return null;
}
