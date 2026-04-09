import { MIN_ACCESSION_COUNT } from "../../constants";

/**
 * Checks if a parsed accession count value is valid.
 * @param value - The parsed numeric value.
 * @returns True if the value is a number and meets the minimum threshold.
 */
export function isValid(value: number): boolean {
  return !isNaN(value) && value >= MIN_ACCESSION_COUNT;
}
