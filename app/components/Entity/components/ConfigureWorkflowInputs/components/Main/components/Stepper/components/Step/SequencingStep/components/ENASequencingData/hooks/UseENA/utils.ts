import { ValidationError } from "yup";
import {
  ACCESSION_SEPARATOR_REGEX,
  ENA_ACCESSION_REGEX_PATTERN,
} from "./constants";
import { AccessionInfo } from "./entities";

/**
 * Determine the appropriate accession type based on the accession ID format.
 * Types are experiment, run, sample, and study.
 * @param accession - ENA accession number.
 * @returns Accession type.
 */
export function getAccessionType(accession: string): string | null {
  for (const [type, pattern] of Object.entries(ENA_ACCESSION_REGEX_PATTERN)) {
    if (pattern.test(accession)) {
      return type;
    }
  }
  return null;
}

/**
 * Parse a string into a list of accessions with types, throwing a ValidationError if any accession is invalid.
 * @param value - Form input value to parse.
 * @param fieldName - Field to associate error with if thrown.
 * @returns array of accession info.
 */
export function parseAccessionList(
  value: string,
  fieldName: string
): AccessionInfo[] {
  const accessions = value.split(ACCESSION_SEPARATOR_REGEX).filter((a) => a);
  return accessions.map((accession) => {
    const accessionType = getAccessionType(accession);
    if (accessionType === null)
      throw new ValidationError(
        `Accession ${JSON.stringify(accession)} is not a supported ENA ID`,
        value,
        fieldName
      );
    return {
      accession,
      accessionType,
    };
  });
}
